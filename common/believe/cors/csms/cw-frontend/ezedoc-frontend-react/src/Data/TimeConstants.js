
/*
 * This is a constants file for timers in the application
 * <-------------->
 * Add all the timer related time in seconds or minutes, milliSeconds etc with 
 * underscore('_') and suffix the time unit. Not Mandatory, but a good practice.
 * ex: Any duration can be written as, 
 * 1) <some varibale>_secs
 * 2) <some varibale>_ms
 * 3) <some varibale>_minutes and etc.
 */

// Time duration constants for Email Settings, SES Component.
export const SES_SETTINGS = {
    total_time_secs: 300,
    ses_interval_ms: 15000,
    display_time: {
        mins: '05',
        secs: '00'
    }
}

export const other = {
    oth: 1
}