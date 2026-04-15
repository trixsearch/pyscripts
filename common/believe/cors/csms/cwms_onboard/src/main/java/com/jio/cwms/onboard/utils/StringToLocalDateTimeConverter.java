package com.jio.cwms.onboard.utils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

import org.springframework.core.convert.ConversionFailedException;
import org.springframework.core.convert.TypeDescriptor;
import org.springframework.core.convert.converter.Converter;

public class StringToLocalDateTimeConverter implements Converter<String, LocalDateTime> {

    private static final TypeDescriptor SOURCE = TypeDescriptor.valueOf(String.class);
    private static final TypeDescriptor TARGET = TypeDescriptor.valueOf(LocalDateTime.class);

    @Override
    public LocalDateTime convert(String source) {
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");
            return LocalDateTime.parse(source, formatter);
        } catch (DateTimeParseException ex) {
            throw new ConversionFailedException(SOURCE, TARGET, source, ex);
        }
    }
}