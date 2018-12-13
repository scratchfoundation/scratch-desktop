#!/bin/sh
SRC=../src/icon/ScratchDesktop.svg
OUT_ICONSET=ScratchDesktop.iconset
OUT_ICNS=ScratchDesktop.icns
OUT_ICO=ScratchDesktop.ico
TMP_ICO=tmp

ICO_BASIC_SIZES="16 24 32 48 256"
ICO_EXTRA_SIZES="20 30 36 40 60 64 72 80 96 512"

if command -v convert >/dev/null 2>&1; then
    # Mac
    if command -v iconutil >/dev/null 2>&1; then
        mkdir -p "${OUT_ICONSET}"
        for SIZE in 16 32 128 256 512; do
            SIZE2=`expr "${SIZE}" '*' 2`
            convert -background none -density 72 -units PixelsPerInch -resize "!${SIZE}x${SIZE}" "${SRC}" "${OUT_ICONSET}/icon_${SIZE}x${SIZE}.png"
            convert -background none -density 144 -units PixelsPerInch -resize "!${SIZE2}x${SIZE2}" "${SRC}" "${OUT_ICONSET}/icon_${SIZE}x${SIZE}@2x.png"
            # sips doesn't support SVG
            #sips -s dpiWidth 72 -s dpiHeight 72 -z "${SIZE}" "${SIZE}" "${SRC}" --out "${OUT_ICONSET}/icon_${SIZE}x${SIZE}.png"
            #sips -s dpiWidth 144 -s dpiHeight 144 -z "${SIZE2}" "${SIZE2}" "${SRC}" --out "${OUT_ICONSET}/icon_${SIZE}x${SIZE}@2x.png"
        done
        if command -v pngcrush >/dev/null 2>&1; then
            for PNG in "${OUT_ICONSET}"/icon_*.png; do
                pngcrush -new -brute -ow "${PNG}"
            done
        else
            echo "pngcrush is not available - skipping PNG optimization"
        fi
        iconutil -c icns --output "${OUT_ICNS}" "${OUT_ICONSET}"
    else
        echo "iconutil is not available - skipping ICNS and ICONSET"
    fi

    # Windows
    mkdir -p "${TMP_ICO}"
    for SIZE in ${ICO_BASIC_SIZES} ${ICO_EXTRA_SIZES}; do
        convert -background none -resize "!${SIZE}x${SIZE}" "${SRC}" "${TMP_ICO}/icon_${SIZE}x${SIZE}.png"
    done
    if command -v pngcrush >/dev/null 2>&1; then
        for PNG in "${TMP_ICO}"/icon_*.png; do
            pngcrush -new -brute -ow "${PNG}"
        done
    else
        echo "pngcrush is not available - skipping PNG optimization"
    fi
    # Asking for "Zip" compression actually results in PNG compression
    convert "${TMP_ICO}"/icon_*.png -colorspace sRGB -compress Zip "${OUT_ICO}"
else
    echo "ImageMagick is not available - cannot convert icons"
fi
