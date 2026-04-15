package com.jio.cwms.onboard.utils;

public class StringUtils {

    private StringUtils() {
        throw new IllegalStateException("Cannot instantiate utility class");
    }

    public static boolean isNotEmpty(final CharSequence cs) {
        return org.apache.commons.lang3.StringUtils.isNotEmpty(cs);
    }

    public static boolean isBlank(final CharSequence cs) {
        return org.apache.commons.lang3.StringUtils.isBlank(cs);
    }
}
