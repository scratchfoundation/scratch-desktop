#ifndef GPIO
#define GPIO

#define DRIVE_UNSET -1
#define DRIVE_LOW    0
#define DRIVE_HIGH   1

#define PULL_UNSET  -1
#define PULL_NONE    0
#define PULL_DOWN    1
#define PULL_UP      2

#define FUNC_UNSET  -1
#define FUNC_IP      0
#define FUNC_OP      1
#define FUNC_A0      4
#define FUNC_A1      5
#define FUNC_A2      6
#define FUNC_A3      7
#define FUNC_A4      3
#define FUNC_A5      2

#define GPIO_MIN     0
#define GPIO_MAX     53

static const char *gpio_alt_names_2708[54*6] =
{
    "SDA0"      , "SA5"        , "PCLK"      , "AVEOUT_VCLK"   , "AVEIN_VCLK" , "-"         ,
    "SCL0"      , "SA4"        , "DE"        , "AVEOUT_DSYNC"  , "AVEIN_DSYNC", "-"         ,
    "SDA1"      , "SA3"        , "LCD_VSYNC" , "AVEOUT_VSYNC"  , "AVEIN_VSYNC", "-"         ,
    "SCL1"      , "SA2"        , "LCD_HSYNC" , "AVEOUT_HSYNC"  , "AVEIN_HSYNC", "-"         ,
    "GPCLK0"    , "SA1"        , "DPI_D0"    , "AVEOUT_VID0"   , "AVEIN_VID0" , "ARM_TDI"   ,
    "GPCLK1"    , "SA0"        , "DPI_D1"    , "AVEOUT_VID1"   , "AVEIN_VID1" , "ARM_TDO"   ,
    "GPCLK2"    , "SOE_N_SE"   , "DPI_D2"    , "AVEOUT_VID2"   , "AVEIN_VID2" , "ARM_RTCK"  ,
    "SPI0_CE1_N", "SWE_N_SRW_N", "DPI_D3"    , "AVEOUT_VID3"   , "AVEIN_VID3" , "-"         ,
    "SPI0_CE0_N", "SD0"        , "DPI_D4"    , "AVEOUT_VID4"   , "AVEIN_VID4" , "-"         ,
    "SPI0_MISO" , "SD1"        , "DPI_D5"    , "AVEOUT_VID5"   , "AVEIN_VID5" , "-"         ,
    "SPI0_MOSI" , "SD2"        , "DPI_D6"    , "AVEOUT_VID6"   , "AVEIN_VID6" , "-"         ,
    "SPI0_SCLK" , "SD3"        , "DPI_D7"    , "AVEOUT_VID7"   , "AVEIN_VID7" , "-"         ,
    "PWM0"      , "SD4"        , "DPI_D8"    , "AVEOUT_VID8"   , "AVEIN_VID8" , "ARM_TMS"   ,
    "PWM1"      , "SD5"        , "DPI_D9"    , "AVEOUT_VID9"   , "AVEIN_VID9" , "ARM_TCK"   ,
    "TXD0"      , "SD6"        , "DPI_D10"   , "AVEOUT_VID10"  , "AVEIN_VID10", "TXD1"      ,
    "RXD0"      , "SD7"        , "DPI_D11"   , "AVEOUT_VID11"  , "AVEIN_VID11", "RXD1"      ,
    "FL0"       , "SD8"        , "DPI_D12"   , "CTS0"          , "SPI1_CE2_N" , "CTS1"      ,
    "FL1"       , "SD9"        , "DPI_D13"   , "RTS0"          , "SPI1_CE1_N" , "RTS1"      ,
    "PCM_CLK"   , "SD10"       , "DPI_D14"   , "I2CSL_SDA_MOSI", "SPI1_CE0_N" , "PWM0"      ,
    "PCM_FS"    , "SD11"       , "DPI_D15"   , "I2CSL_SCL_SCLK", "SPI1_MISO"  , "PWM1"      ,
    "PCM_DIN"   , "SD12"       , "DPI_D16"   , "I2CSL_MISO"    , "SPI1_MOSI"  , "GPCLK0"    ,
    "PCM_DOUT"  , "SD13"       , "DPI_D17"   , "I2CSL_CE_N"    , "SPI1_SCLK"  , "GPCLK1"    ,
    "SD0_CLK"   , "SD14"       , "DPI_D18"   , "SD1_CLK"       , "ARM_TRST"   , "-"         ,
    "SD0_CMD"   , "SD15"       , "DPI_D19"   , "SD1_CMD"       , "ARM_RTCK"   , "-"         ,
    "SD0_DAT0"  , "SD16"       , "DPI_D20"   , "SD1_DAT0"      , "ARM_TDO"    , "-"         ,
    "SD0_DAT1"  , "SD17"       , "DPI_D21"   , "SD1_DAT1"      , "ARM_TCK"    , "-"         ,
    "SD0_DAT2"  , "TE0"        , "DPI_D22"   , "SD1_DAT2"      , "ARM_TDI"    , "-"         ,
    "SD0_DAT3"  , "TE1"        , "DPI_D23"   , "SD1_DAT3"      , "ARM_TMS"    , "-"         ,
    "SDA0"      , "SA5"        , "PCM_CLK"   , "FL0"           , "-"          , "-"         ,
    "SCL0"      , "SA4"        , "PCM_FS"    , "FL1"           , "-"          , "-"         ,
    "TE0"       , "SA3"        , "PCM_DIN"   , "CTS0"          , "-"          , "CTS1"      ,
    "FL0"       , "SA2"        , "PCM_DOUT"  , "RTS0"          , "-"          , "RTS1"      ,
    "GPCLK0"    , "SA1"        , "RING_OCLK" , "TXD0"          , "-"          , "TXD1"      ,
    "FL1"       , "SA0"        , "TE1"       , "RXD0"          , "-"          , "RXD1"      ,
    "GPCLK0"    , "SOE_N_SE"   , "TE2"       , "SD1_CLK"       , "-"          , "-"         ,
    "SPI0_CE1_N", "SWE_N_SRW_N", "-"         , "SD1_CMD"       , "-"          , "-"         ,
    "SPI0_CE0_N", "SD0"        , "TXD0"      , "SD1_DAT0"      , "-"          , "-"         ,
    "SPI0_MISO" , "SD1"        , "RXD0"      , "SD1_DAT1"      , "-"          , "-"         ,
    "SPI0_MOSI" , "SD2"        , "RTS0"      , "SD1_DAT2"      , "-"          , "-"         ,
    "SPI0_SCLK" , "SD3"        , "CTS0"      , "SD1_DAT3"      , "-"          , "-"         ,
    "PWM0"      , "SD4"        , "-"         , "SD1_DAT4"      , "SPI2_MISO"  , "TXD1"      ,
    "PWM1"      , "SD5"        , "TE0"       , "SD1_DAT5"      , "SPI2_MOSI"  , "RXD1"      ,
    "GPCLK1"    , "SD6"        , "TE1"       , "SD1_DAT6"      , "SPI2_SCLK"  , "RTS1"      ,
    "GPCLK2"    , "SD7"        , "TE2"       , "SD1_DAT7"      , "SPI2_CE0_N" , "CTS1"      ,
    "GPCLK1"    , "SDA0"       , "SDA1"      , "TE0"           , "SPI2_CE1_N" , "-"         ,
    "PWM1"      , "SCL0"       , "SCL1"      , "TE1"           , "SPI2_CE2_N" , "-"         ,
    "SDA0"      , "SDA1"       , "SPI0_CE0_N", "-"             , "-"          , "SPI2_CE1_N",
    "SCL0"      , "SCL1"       , "SPI0_MISO" , "-"             , "-"          , "SPI2_CE0_N",
    "SD0_CLK"   , "FL0"        , "SPI0_MOSI" , "SD1_CLK"       , "ARM_TRST"   , "SPI2_SCLK" ,
    "SD0_CMD"   , "GPCLK0"     , "SPI0_SCLK" , "SD1_CMD"       , "ARM_RTCK"   , "SPI2_MOSI" ,
    "SD0_DAT0"  , "GPCLK1"     , "PCM_CLK"   , "SD1_DAT0"      , "ARM_TDO"    , "-"         ,
    "SD0_DAT1"  , "GPCLK2"     , "PCM_FS"    , "SD1_DAT1"      , "ARM_TCK"    , "-"         ,
    "SD0_DAT2"  , "PWM0"       , "PCM_DIN"   , "SD1_DAT2"      , "ARM_TDI"    , "-"         ,
    "SD0_DAT3"  , "PWM1"       , "PCM_DOUT"  , "SD1_DAT3"      , "ARM_TMS"    , "-"
};

static const char *gpio_alt_names_2711[54*6] =
{
    "SDA0"      , "SA5"        , "PCLK"      , "SPI3_CE0_N"    , "TXD2"            , "SDA6"        ,
    "SCL0"      , "SA4"        , "DE"        , "SPI3_MISO"     , "RXD2"            , "SCL6"        ,
    "SDA1"      , "SA3"        , "LCD_VSYNC" , "SPI3_MOSI"     , "CTS2"            , "SDA3"        ,
    "SCL1"      , "SA2"        , "LCD_HSYNC" , "SPI3_SCLK"     , "RTS2"            , "SCL3"        ,
    "GPCLK0"    , "SA1"        , "DPI_D0"    , "SPI4_CE0_N"    , "TXD3"            , "SDA3"        ,
    "GPCLK1"    , "SA0"        , "DPI_D1"    , "SPI4_MISO"     , "RXD3"            , "SCL3"        ,
    "GPCLK2"    , "SOE_N_SE"   , "DPI_D2"    , "SPI4_MOSI"     , "CTS3"            , "SDA4"        ,
    "SPI0_CE1_N", "SWE_N_SRW_N", "DPI_D3"    , "SPI4_SCLK"     , "RTS3"            , "SCL4"        ,
    "SPI0_CE0_N", "SD0"        , "DPI_D4"    , "I2CSL_CE_N"    , "TXD4"            , "SDA4"        ,
    "SPI0_MISO" , "SD1"        , "DPI_D5"    , "I2CSL_SDI_MISO", "RXD4"            , "SCL4"        ,
    "SPI0_MOSI" , "SD2"        , "DPI_D6"    , "I2CSL_SDA_MOSI", "CTS4"            , "SDA5"        ,
    "SPI0_SCLK" , "SD3"        , "DPI_D7"    , "I2CSL_SCL_SCLK", "RTS4"            , "SCL5"        ,
    "PWM0_0"    , "SD4"        , "DPI_D8"    , "SPI5_CE0_N"    , "TXD5"            , "SDA5"        ,
    "PWM0_1"    , "SD5"        , "DPI_D9"    , "SPI5_MISO"     , "RXD5"            , "SCL5"        ,
    "TXD0"      , "SD6"        , "DPI_D10"   , "SPI5_MOSI"     , "CTS5"            , "TXD1"        ,
    "RXD0"      , "SD7"        , "DPI_D11"   , "SPI5_SCLK"     , "RTS5"            , "RXD1"        ,
    "-"         , "SD8"        , "DPI_D12"   , "CTS0"          , "SPI1_CE2_N"      , "CTS1"        ,
    "-"         , "SD9"        , "DPI_D13"   , "RTS0"          , "SPI1_CE1_N"      , "RTS1"        ,
    "PCM_CLK"   , "SD10"       , "DPI_D14"   , "SPI6_CE0_N"    , "SPI1_CE0_N"      , "PWM0_0"      ,
    "PCM_FS"    , "SD11"       , "DPI_D15"   , "SPI6_MISO"     , "SPI1_MISO"       , "PWM0_1"      ,
    "PCM_DIN"   , "SD12"       , "DPI_D16"   , "SPI6_MOSI"     , "SPI1_MOSI"       , "GPCLK0"      ,
    "PCM_DOUT"  , "SD13"       , "DPI_D17"   , "SPI6_SCLK"     , "SPI1_SCLK"       , "GPCLK1"      ,
    "SD0_CLK"   , "SD14"       , "DPI_D18"   , "SD1_CLK"       , "ARM_TRST"        , "SDA6"        ,
    "SD0_CMD"   , "SD15"       , "DPI_D19"   , "SD1_CMD"       , "ARM_RTCK"        , "SCL6"        ,
    "SD0_DAT0"  , "SD16"       , "DPI_D20"   , "SD1_DAT0"      , "ARM_TDO"         , "SPI3_CE1_N"  ,
    "SD0_DAT1"  , "SD17"       , "DPI_D21"   , "SD1_DAT1"      , "ARM_TCK"         , "SPI4_CE1_N"  ,
    "SD0_DAT2"  , "-"          , "DPI_D22"   , "SD1_DAT2"      , "ARM_TDI"         , "SPI5_CE1_N"  ,
    "SD0_DAT3"  , "-"          , "DPI_D23"   , "SD1_DAT3"      , "ARM_TMS"         , "SPI6_CE1_N"  ,
    "SDA0"      , "SA5"        , "PCM_CLK"   , "-"             , "MII_A_RX_ERR"    , "RGMII_MDIO"  ,
    "SCL0"      , "SA4"        , "PCM_FS"    , "-"             , "MII_A_TX_ERR"    , "RGMII_MDC"   ,
    "-"         , "SA3"        , "PCM_DIN"   , "CTS0"          , "MII_A_CRS"       , "CTS1"        ,
    "-"         , "SA2"        , "PCM_DOUT"  , "RTS0"          , "MII_A_COL"       , "RTS1"        ,
    "GPCLK0"    , "SA1"        , "-"         , "TXD0"          , "SD_CARD_PRES"    , "TXD1"        ,
    "-"         , "SA0"        , "-"         , "RXD0"          , "SD_CARD_WRPROT"  , "RXD1"        ,
    "GPCLK0"    , "SOE_N_SE"   , "-"         , "SD1_CLK"       , "SD_CARD_LED"     , "RGMII_IRQ"   ,
    "SPI0_CE1_N", "SWE_N_SRW_N", "-"         , "SD1_CMD"       , "RGMII_START_STOP", "-"           ,
    "SPI0_CE0_N", "SD0"        , "TXD0"      , "SD1_DAT0"      , "RGMII_RX_OK"     , "MII_A_RX_ERR",
    "SPI0_MISO" , "SD1"        , "RXD0"      , "SD1_DAT1"      , "RGMII_MDIO"      , "MII_A_TX_ERR",
    "SPI0_MOSI" , "SD2"        , "RTS0"      , "SD1_DAT2"      , "RGMII_MDC"       , "MII_A_CRS"   ,
    "SPI0_SCLK" , "SD3"        , "CTS0"      , "SD1_DAT3"      , "RGMII_IRQ"       , "MII_A_COL"   ,
    "PWM1_0"    , "SD4"        , "-"         , "SD1_DAT4"      , "SPI0_MISO"       , "TXD1"        ,
    "PWM1_1"    , "SD5"        , "-"         , "SD1_DAT5"      , "SPI0_MOSI"       , "RXD1"        ,
    "GPCLK1"    , "SD6"        , "-"         , "SD1_DAT6"      , "SPI0_SCLK"       , "RTS1"        ,
    "GPCLK2"    , "SD7"        , "-"         , "SD1_DAT7"      , "SPI0_CE0_N"      , "CTS1"        ,
    "GPCLK1"    , "SDA0"       , "SDA1"      , "-"             , "SPI0_CE1_N"      , "SD_CARD_VOLT",
    "PWM0_1"    , "SCL0"       , "SCL1"      , "-"             , "SPI0_CE2_N"      , "SD_CARD_PWR0",
    "SDA0"      , "SDA1"       , "SPI0_CE0_N", "-"             , "-"               , "SPI2_CE1_N"  ,
    "SCL0"      , "SCL1"       , "SPI0_MISO" , "-"             , "-"               , "SPI2_CE0_N"  ,
    "SD0_CLK"   , "-"          , "SPI0_MOSI" , "SD1_CLK"       , "ARM_TRST"        , "SPI2_SCLK"   ,
    "SD0_CMD"   , "GPCLK0"     , "SPI0_SCLK" , "SD1_CMD"       , "ARM_RTCK"        , "SPI2_MOSI"   ,
    "SD0_DAT0"  , "GPCLK1"     , "PCM_CLK"   , "SD1_DAT0"      , "ARM_TDO"         , "SPI2_MISO"   ,
    "SD0_DAT1"  , "GPCLK2"     , "PCM_FS"    , "SD1_DAT1"      , "ARM_TCK"         , "SD_CARD_LED" ,
    "SD0_DAT2"  , "PWM0_0"     , "PCM_DIN"   , "SD1_DAT2"      , "ARM_TDI"         , "-"           ,
    "SD0_DAT3"  , "PWM0_1"     , "PCM_DOUT"  , "SD1_DAT3"      , "ARM_TMS"         , "-"           ,
};

static const char *gpio_fsel_alts[8] =
{
    " ", " ", "5", "4", "0", "1", "2", "3"
};

static const char *gpio_pull_names[4] =
{
    "NONE", "DOWN", "UP", "?"
};

/* 0 = none, 1 = down, 2 = up */
static const int gpio_default_pullstate[54] =
{
    2,2,2,2,2,2,2,2,2, /*GPIO0-8 UP*/
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1, /*GPIO9-27 DOWN*/
    0,0, /*GPIO28-29 NONE*/
    1,1,1,1, /*GPIO30-33 DOWN*/
    2,2,2, /*GPIO34-36 UP*/
    1,1,1,1,1,1,1, /*GPIO37-43 DOWN*/
    0,0, /*GPIO44-45 NONE*/
    2,2,2,2,2,2,2,2 /*GPIO46-53 UP*/
};

#define GPIO_BASE_OFFSET  0x00200000

#define BLOCK_SIZE  (4*1024)

#define GPSET0    7
#define GPSET1    8
#define GPCLR0    10
#define GPCLR1    11
#define GPLEV0    13
#define GPLEV1    14
#define GPPUD     37
#define GPPUDCLK0 38
#define GPPUDCLK1 39

/* 2711 has a different mechanism for pin pull-up/down/enable  */
#define GPPUPPDN0                57        /* Pin pull-up/down for pins 15:0  */
#define GPPUPPDN1                58        /* Pin pull-up/down for pins 31:16 */
#define GPPUPPDN2                59        /* Pin pull-up/down for pins 47:32 */
#define GPPUPPDN3                60        /* Pin pull-up/down for pins 57:48 */

int get_gpio_level(int gpio);
int get_gpio_fsel(int gpio);
int set_gpio_fsel(int gpio, int fsel);
int get_gpio_level(int gpio);
int set_gpio_value(int gpio, int value);
int gpio_fsel_to_namestr(int gpio, int fsel, char *name);
int gpio_set_pull(int gpio, int type);
int get_gpio_pull(int pinnum);
int gpio_get(int pinnum);
int gpio_set(int pinnum, int fsparam, int drive, int pull);
int setup();
extern volatile uint32_t *gpio_base;
extern int is_2711;
extern const char **gpio_alt_names;
#endif 
