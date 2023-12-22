/*
  Reads GPIO state and dumps to console.
  Allows GPIO hacking to set and get GPIO state.
  Author: James Adams
*/

#include <stdio.h>
#include <stdarg.h>
#include <stdint.h>
#include <stdlib.h>
#include <ctype.h>
#include <unistd.h>
#include <errno.h>
#include <string.h>
#include <fcntl.h>
#include <sys/mman.h>
#include <time.h>
#include "raspi-gpio.h"

/* Pointer to HW */
volatile uint32_t *gpio_base=0;
int is_2711;
const char **gpio_alt_names;

void print_gpio_alts_info(int gpio)
{
    int alt;
    printf("%d", gpio);
    if (gpio_default_pullstate[gpio] == 0)
        printf(", NONE");
    else if (gpio_default_pullstate[gpio] == 1)
        printf(", DOWN");
    else
        printf(", UP");
    for (alt=0; alt < 6; alt++)
    {
        printf(", %s", gpio_alt_names[gpio*6+alt]);
    }
    printf("\n");
}

void delay_us(uint32_t delay)
{
    struct timespec tv_req;
    struct timespec tv_rem;
    int i;
    uint32_t del_ms, del_us;
    del_ms = delay / 1000;
    del_us = delay % 1000;
    for (i=0; i<=del_ms; i++)
    {
        tv_req.tv_sec = 0;
        if (i==del_ms) tv_req.tv_nsec = del_us*1000;
        else          tv_req.tv_nsec = 1000000;
        tv_rem.tv_sec = 0;
        tv_rem.tv_nsec = 0;
        nanosleep(&tv_req, &tv_rem);
        if (tv_rem.tv_sec != 0 || tv_rem.tv_nsec != 0)
            printf("timer oops!\n");
    }
}

uint32_t get_hwbase(void)
{
    const char *ranges_file = "/proc/device-tree/soc/ranges";
    uint8_t ranges[12];
    FILE *fd;
    uint32_t ret = 0;

    memset(ranges, 0, sizeof(ranges));

    if ((fd = fopen(ranges_file, "rb")) == NULL)
    {
        printf("Can't open '%s'\n", ranges_file);
    }
    else if (fread(ranges, 1, sizeof(ranges), fd) >= 8)
    {
        ret = (ranges[4] << 24) |
              (ranges[5] << 16) |
              (ranges[6] << 8) |
              (ranges[7] << 0);
        if (!ret)
            ret = (ranges[8] << 24) |
                  (ranges[9] << 16) |
                  (ranges[10] << 8) |
                  (ranges[11] << 0);
        if ((ranges[0] != 0x7e) ||
                (ranges[1] != 0x00) ||
                (ranges[2] != 0x00) ||
                (ranges[3] != 0x00) ||
                ((ret != 0x20000000) && (ret != 0x3f000000) && (ret != 0xfe000000)))
        {
            printf("Unexpected ranges data (%02x%02x%02x%02x %02x%02x%02x%02x %02x%02x%02x%02x)\n",
                   ranges[0], ranges[1], ranges[2], ranges[3],
                   ranges[4], ranges[5], ranges[6], ranges[7],
                   ranges[8], ranges[9], ranges[10], ranges[11]);
            ret = 0;
        }
    }
    else
    {
        printf("Ranges data too short\n");
    }

    fclose(fd);

    return ret;
}

int get_gpio_fsel(int gpio)
{
    /* GPIOFSEL0-GPIOFSEL5 with 10 sels per 32 bit reg,
       3 bits per sel (so bits 0:29 used) */
    uint32_t reg = gpio / 10;
    uint32_t sel = gpio % 10;
    if (gpio < GPIO_MIN || gpio > GPIO_MAX) return -1;
    /*printf("reg = %d, sel = %d ", reg, sel);*/
    return (int)((*(gpio_base+reg))>>(3*sel))&0x7;
}

int set_gpio_fsel(int gpio, int fsel)
{
    static volatile uint32_t *tmp;
    uint32_t reg = gpio / 10;
    uint32_t sel = gpio % 10;
    uint32_t mask;
    if (gpio < GPIO_MIN || gpio > GPIO_MAX) return -1;
    tmp = gpio_base+reg;
    mask = 0x7<<(3*sel);
    mask = ~mask;
    /*printf("reg = %d, sel = %d, mask=%08X\n", reg, sel, mask);*/
    tmp = gpio_base+reg;
    *tmp = *tmp & mask;
    *tmp = *tmp | ((fsel&0x7)<<(3*sel));
    return (int)((*tmp)>>(3*sel))&0x7;
}

int get_gpio_level(int gpio)
{
    if (gpio < GPIO_MIN || gpio > GPIO_MAX) return -1;
    if (gpio < 32)
    {
        return ((*(gpio_base+GPLEV0))>>gpio)&0x1;
    }
    else
    {
        gpio = gpio-32;
        return ((*(gpio_base+GPLEV1))>>gpio)&0x1;
    }
}

int set_gpio_value(int gpio, int value)
{
    if (gpio < GPIO_MIN || gpio > GPIO_MAX) return -1;
    if (value != 0)
    {
        if (gpio < 32)
        {
            *(gpio_base+GPSET0) = 0x1<<gpio;
        }
        else
        {
            gpio -= 32;
            *(gpio_base+GPSET1) = 0x1<<gpio;
        }
    }
    else
    {
        if (gpio < 32)
        {
            *(gpio_base+GPCLR0) = 0x1<<gpio;
        }
        else
        {
            gpio -= 32;
            *(gpio_base+GPCLR1) = 0x1<<gpio;
        }
    }
    return 0;
}

int gpio_fsel_to_namestr(int gpio, int fsel, char *name)
{
    int altfn = 0;
    if (gpio < GPIO_MIN || gpio > GPIO_MAX) return -1;
    switch (fsel)
    {
    case 0:
        return sprintf(name, "INPUT");
    case 1:
        return sprintf(name, "OUTPUT");
    case 2:
        altfn = 5;
        break;
    case 3:
        altfn = 4;
        break;
    case 4:
        altfn = 0;
        break;
    case 5:
        altfn = 1;
        break;
    case 6:
        altfn = 2;
        break;
    default:  /*case 7*/
        altfn = 3;
        break;
    }
    return sprintf(name, "%s", gpio_alt_names[gpio*6 + altfn]);
}

void print_raw_gpio_regs(void)
{
    int i;
    int end = is_2711 ? GPPUPPDN3 : GPPUDCLK1;

    for (i = 0; i <= end; i++)
    {
        /* Skip over non-GPIO registers on Pi4 models */
        if (i == (GPPUDCLK1 + 1))
        {
            i = GPPUPPDN0;
            printf("%02x:%*s", i * 4, (i & 3) * 9, "");
        }

        uint32_t val = *(gpio_base + i);
        if ((i & 3) == 0)
            printf("%02x:", i * 4);
        printf(" %08x", val);
        if ((i & 3) == 3)
            printf("\n");
    }
    if (i & 3)
        printf("\n");
}

void print_help()
{
    char *name = "raspi-gpio"; /* in case we want to rename */
    printf("\n");
    printf("WARNING! %s set writes directly to the GPIO control registers\n", name);
    printf("ignoring whatever else may be using them (such as Linux drivers) -\n");
    printf("it is designed as a debug tool, only use it if you know what you\n");
    printf("are doing and at your own risk!\n");
    printf("\n");
    printf("The %s tool is designed to help hack / debug BCM283x GPIO.\n", name);
    printf("Running %s with the help argument prints this help.\n", name);
    printf("%s can get and print the state of a GPIO (or all GPIOs)\n", name);
    printf("and can be used to set the function, pulls and value of a GPIO.\n");
    printf("%s must be run as root.\n", name);
    printf("Use:\n");
    printf("  %s get [GPIO]\n", name);
    printf("OR\n");
    printf("  %s set <GPIO> [options]\n", name);
    printf("OR\n");
    printf("  %s funcs [GPIO]\n", name);
    printf("OR\n");
    printf("  %s raw\n", name);
    printf("\n");
    printf("GPIO is a comma-separated list of pin numbers or ranges (without spaces),\n");
    printf("e.g. 4 or 18-21 or 7,9-11\n");
    printf("Note that omitting [GPIO] from %s get prints all GPIOs.\n", name);
    printf("%s funcs will dump all the possible GPIO alt funcions in CSV format\n", name);
    printf("or if [GPIO] is specified the alternate funcs just for that specific GPIO.\n");
    printf("Valid [options] for %s set are:\n", name);
    printf("  ip      set GPIO as input\n");
    printf("  op      set GPIO as output\n");
    printf("  a0-a5   set GPIO to alternate function alt0-alt5\n");
    printf("  pu      set GPIO in-pad pull up\n");
    printf("  pd      set GPIO pin-pad pull down\n");
    printf("  pn      set GPIO pull none (no pull)\n");
    printf("  dh      set GPIO to drive to high (1) level (only valid if set to be an output)\n");
    printf("  dl      set GPIO to drive low (0) level (only valid if set to be an output)\n");
    printf("Examples:\n");
    printf("  %s get              Prints state of all GPIOs one per line\n", name);
    printf("  %s get 20           Prints state of GPIO20\n", name);
    printf("  %s get 20,21        Prints state of GPIO20 and GPIO21\n", name);
    printf("  %s set 20 a5        Set GPIO20 to ALT5 function (GPCLK0)\n", name);
    printf("  %s set 20 pu        Enable GPIO20 ~50k in-pad pull up\n", name);
    printf("  %s set 20 pd        Enable GPIO20 ~50k in-pad pull down\n", name);
    printf("  %s set 20 op        Set GPIO20 to be an output\n", name);
    printf("  %s set 20 dl        Set GPIO20 to output low/zero (must already be set as an output)\n", name);
    printf("  %s set 20 ip pd     Set GPIO20 to input with pull down\n", name);
    printf("  %s set 35 a0 pu     Set GPIO35 to ALT0 function (SPI_CE1_N) with pull up\n", name);
    printf("  %s set 20 op pn dh  Set GPIO20 to ouput with no pull and driving high\n", name);
}

/*
 * type:
 *   0 = no pull
 *   1 = pull down
 *   2 = pull up
 */
int gpio_set_pull(int gpio, int type)
{
    if (gpio < GPIO_MIN || gpio > GPIO_MAX) return -1;
    if (type < 0 || type > 2) return -1;

    if (is_2711)
    {
        int pullreg = GPPUPPDN0 + (gpio>>4);
        int pullshift = (gpio & 0xf) << 1;
        unsigned int pullbits;
        unsigned int pull;

        switch (type)
        {
        case PULL_NONE:
            pull = 0;
            break;
        case PULL_UP:
            pull = 1;
            break;
        case PULL_DOWN:
            pull = 2;
            break;
        default:
            return 1; /* An illegal value */
        }


        pullbits = *(gpio_base + pullreg);
        pullbits &= ~(3 << pullshift);
        pullbits |= (pull << pullshift);
        *(gpio_base + pullreg) = pullbits;
    }
    else
    {
        int clkreg = GPPUDCLK0 + (gpio>>5);
        int clkbit = 1 << (gpio & 0x1f);

        *(gpio_base + GPPUD) = type;
        delay_us(10);
        *(gpio_base + clkreg) = clkbit;
        delay_us(10);
        *(gpio_base + GPPUD) = 0;
        delay_us(10);
        *(gpio_base + clkreg) = 0;
        delay_us(10);
    }

    return 0;
}

int get_gpio_pull(int pinnum)
{
    int pull = PULL_UNSET;
    if (is_2711)
    {
        int pull_bits = (*(gpio_base + GPPUPPDN0 + (pinnum >> 4)) >> ((pinnum & 0xf)<<1)) & 0x3;
        switch (pull_bits)
        {
        case 0:
            pull = PULL_NONE;
            break;
        case 1:
            pull = PULL_UP;
            break;
        case 2:
            pull = PULL_DOWN;
            break;
        default:
            pull = PULL_UNSET;
            break; /* An illegal value */
        }
    }
    return pull;
}

int gpio_get(int pinnum)
{
    char name[512];
    char pullstr[12];
    int level;
    int fsel;
    int pull;
    int n;

    fsel = get_gpio_fsel(pinnum);
    gpio_fsel_to_namestr(pinnum, fsel, name);
    level = get_gpio_level(pinnum);
    pullstr[0] = '\0';
    pull = get_gpio_pull(pinnum);
    if (pull != PULL_UNSET)
        sprintf(pullstr, " pull=%s", gpio_pull_names[pull & 3]);
    if (fsel < 2)
        printf("GPIO %d: level=%d fsel=%d func=%s%s\n",
               pinnum, level, fsel, name, pullstr);
    else
        printf("GPIO %d: level=%d fsel=%d alt=%s func=%s%s\n",
               pinnum, level, fsel, gpio_fsel_alts[fsel], name, pullstr);
    return 0;
}

int gpio_set(int pinnum, int fsparam, int drive, int pull)
{
    /* set function */
    if (fsparam != FUNC_UNSET)
        set_gpio_fsel(pinnum, fsparam);

    /* set output value (check pin is output first) */
    if (drive != DRIVE_UNSET)
    {
        if (get_gpio_fsel(pinnum) == 1)
        {
            set_gpio_value(pinnum, drive);
        }
        else
        {
            printf("Can't set pin value, not an output\n");
            return 1;
        }
    }

    /* set pulls */
    if (pull != PULL_UNSET)
        return gpio_set_pull(pinnum, pull);

    return 0;
}

int setup(){

    int fd;
    uint32_t hwbase = get_hwbase();
    /* Check for /dev/gpiomem, else we need root access for /dev/mem */
    if ((fd = open ("/dev/gpiomem", O_RDWR | O_SYNC | O_CLOEXEC) ) >= 0)
    {
        gpio_base = (uint32_t *)mmap(0, BLOCK_SIZE, PROT_READ|PROT_WRITE, MAP_SHARED, fd, 0);
    }
    else
    {
        if (geteuid())
        {
            printf("Must be root\n");
            return EXIT_FAILURE;
        }

        if (!hwbase)
            return EXIT_FAILURE;

        if ((fd = open ("/dev/mem", O_RDWR | O_SYNC | O_CLOEXEC) ) < 0)
        {
            printf("Unable to open /dev/mem: %s\n", strerror (errno));
            return EXIT_FAILURE;
        }

        gpio_base = (uint32_t *)mmap(0, BLOCK_SIZE, PROT_READ|PROT_WRITE, MAP_SHARED, fd, GPIO_BASE_OFFSET+hwbase);
    }

    if (gpio_base == (uint32_t *)-1)
    {
        printf("mmap (GPIO) failed: %s\n", strerror (errno));
        return EXIT_FAILURE;
    }

    is_2711 = (*(gpio_base+GPPUPPDN3) != 0x6770696f);
    gpio_alt_names = is_2711 ? gpio_alt_names_2711 : gpio_alt_names_2708;

    return EXIT_SUCCESS;
}

