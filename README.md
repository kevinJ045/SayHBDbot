# SayHBDbot
Is a nodejs script that sends messages to people based on a schedule, and it can be used for events like birthdays, holidays and such.

To setup a schedule you just need to send a request to the server with this data
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"date": "2024-01-09", "person_address": "tg:@telegram_username", "event": "MyFavoriteHoliday", "event_message": "Happy MyFavoriteHoliday!", "message_sent": false, "annual_send": false}' \
  http://[Server-Address]/schedule-event
```
> Note: the date format must be 2024-01-09 or YYYY-MM-DD or YEAR-MONTH-DATE.

To setup a server of your own, make sure to host it in any server with these environment variables:
+ `MONGO_URL`: The mongo db url to store the schedules
+ `TELEGRAM_API_ID`: Your Telegram API ID for sending messages
+ `TELEGRAM_API_HASH`: Your Telegram API hash for sending messages
+ `TELEGRAM_SESSION`: Your Telegram session string(you can get it by logging in from a code)
+ `PERSON_NAME`: Your name, so that people know who the message was sent from(if you use email)
+ `EMAIL`: An email address to send emails
+ `EMAIL_PASSWORD`: Password for the email address