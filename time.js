const Discord = require('discord.js');
var timezones = require('./timezones.json');
var messageHandler = require('./messageHandler.js');

function constructOutputString(inputDate, pastDate, days, hours, minutes) {
    var outputString = ""
    var addComma = false;

    if (pastDate) {
        outputString = inputDate + " was "
    }
    else {
        outputString = inputDate + " is in "
    }

    if (days > 0) {
        outputString = outputString + days + " days"
        addComma = true;
    }
    if (hours > 0) {
        if (addComma) {
            outputString = outputString + ", "
        }
        outputString = outputString + hours + " hours"
        addComma = true;
    }
    if (minutes > 0) {
        if (addComma) {
            outputString = outputString + ", "
        }
        outputString = outputString + minutes + " minutes"
    }

    if (pastDate) {
        outputString = outputString + " ago"
    }
    
    return outputString
}

module.exports = {
    timeUntil: function(message) {
        let inputString = message.content.substr(6, message.content.length - 6);
        let inputParts = inputString.split(" ");

    
        var date = "";
        var inputTime = "";
        var inputTT = "";
        var inputTimezone = "";

        if (inputParts.length == 3) {
            date = new Date().toISOString().slice(0, 10)
            inputTime = inputParts[0];
            inputTT = inputParts[1];
            inputTimezone = inputParts[2];
        }
        else {
            messageHandler.send(message.channel, "Expected input format: hh:mm tt zone  (example: 04:20 PM PDT)", "PC Online", true);
            return;
        }

        let inputTimeParts = inputTime.split(':');
        if (inputTimeParts.length != 2) {
            messageHandler.send(message.channel, "Unable to parse input time", "PC Online", true);
            return;
        }

        let inputHour = inputTimeParts[0].padStart(2, '0');
        let inputMinute = inputTimeParts[1].padStart(2, '0');
        
        if(inputTT.toUpperCase() == 'PM') {
            if(inputHour != "12"){
              inputHour = (parseInt(inputHour, 10) + 12).toString();   
            }
        } else {
            if(inputHour == "12") {
                inputHour = "00"
            }
        }

        var inputTimezoneOffset = "";
        var inputTimezoneIsDST = false;
        let currentDate = new Date();
        
        Date.prototype.stdTimezoneOffset = function () {
            var jan = new Date(this.getFullYear(), 0, 1);
            var jul = new Date(this.getFullYear(), 6, 1);
            return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
        }  

        Date.prototype.isDstObserved = function () {
            return this.getTimezoneOffset() < this.stdTimezoneOffset();
        }
        
        if(inputTimezone.toLowerCase() == "connery") {
            if(currentDate.isDstObserved()) {
                inputString = inputString.replace(inputTimezone, "PDT")
                inputTimezone = "PDT"
            } else {
                inputString = inputString.replace(inputTimezone, "PST")
                inputTimezone = "PST"
            }
        }
        
        if(inputTimezone.toLowerCase() == "emerald" || inputTimezone.toLowerCase() == "jaeger") {
            if(currentDate.isDstObserved()) {
                inputString = inputString.replace(inputTimezone, "EDT")
                inputTimezone = "EDT"
            } else {
                inputString = inputString.replace(inputTimezone, "EST")
                inputTimezone = "EST"
            }
        }        

        for (var i = 0; i < timezones.length; i++) {
            if (timezones[i].abbr.toLowerCase() == inputTimezone.toLowerCase()) {
                inputTimezoneOffset = timezones[i].offset;
                inputTimezoneIsDST = timezones[i].isdst;
            }
        }

        if (inputTimezoneOffset == "") {
            messageHandler.send(message.channel, "Unsupported timezone " + inputTimezone, "PC Online", true);
            return;
        }
        

        let cleanTimestamp = date + "T" + inputHour + ":" + inputMinute + ":" + "00.000" + inputTimezoneOffset;

        let inputParsedDate = new Date(cleanTimestamp);

        let dateDiff = inputParsedDate - currentDate;


        var days = 0;
        var hours = 0;
        var minutes = 0;
        var pastDate = false;
        if (dateDiff < 0) {
            pastDate = true;
            dateDiff = dateDiff * -1
        }

        if (dateDiff >= 86400000) {
            days = Math.floor(dateDiff / 86400000)
            dateDiff = dateDiff - (days * 86400000)
        }

        if (dateDiff >= 3600000) {
            hours = Math.floor(dateDiff / 3600000)
            dateDiff = dateDiff - (hours * 3600000)
        }

        if (dateDiff >= 60000) {
            minutes = Math.floor(dateDiff / 60000)
        }
        
                
        if(currentDate.isDstObserved() != inputTimezoneIsDST && inputTimezoneIsDST != null) {
            if(currentDate.isDstObserved()) {
                messageHandler.send(message.channel, "Warning: Daylight savings is currently observed.  Input timezone is not a daylight savings timezone.", "PC Online", false);
            } else {
                messageHandler.send(message.channel, "Warning: Daylight savings is not currently observed.  Input timezone is a daylight savings timezone.", "PC Online", false);   
            }
        }

        messageHandler.send(message.channel, constructOutputString(inputString, pastDate, days, hours, minutes), "PC Online", false);
    }
}