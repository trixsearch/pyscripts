package com.jio.cwms.onboard.utils;

import java.sql.Timestamp;
import java.util.Date;

import org.springframework.core.convert.converter.Converter;

public class DateToTimestampConverter implements Converter<Date, Timestamp> {

    @Override
    public Timestamp convert(Date source) {
        return new Timestamp(source.getTime());
    }
}
