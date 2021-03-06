Vue.component('weekday', {
  template: document.getElementById("weekday-template").innerText,
  props: ['date', 'events'],
  methods: {
    starting: function(event) {
      var timing = new Date(event.starts_at);
      return this.formatDate(timing, "h:mm a");
    },
    formatDate: function(date, format) {
      if(format === "short") {
        return date.getMonth() + 1 + "/" + date.getDate();
      } else if (format === "long") {
        return this.weekdayName(date.getDay()) + " " + (date.getMonth() + 1) + "/" + date.getDate();
      } else if (format === "longtime") {
        return this.weekdayName(date.getDay()) + " " + (date.getMonth() + 1) + "/" + date.getDate() + " at " + (date.getHours() + 1);
      } else {
        return moment(date).format(format)
      }
    },
    weekdayName: function(weekday) {
      if(weekday === 0) return "Sunday";
      if(weekday === 1) return "Monday";
      if(weekday === 2) return "Tuesday";
      if(weekday === 3) return "Wednesday";
      if(weekday === 4) return "Thursday";
      if(weekday === 5) return "Friday";
      if(weekday === 6) return "Saturday";
    }
  }
})

var view = function() {
  if(window.localStorage) {
    return localStorage.getItem("view") || "month";
  } else {
    return "month";
  }
}

var today = function() {
  if(window.location.hash) {
    var date = window.location.hash.substring(2);
    var parts = date.split("-");
    return new Date(parts[0], parseInt(parts[1]) - 1, parts[2]);
  } else {
    return new Date();
  }
}

new Vue({
  el: "#calendar",
  data: {
    events: window.events,
    today: new Date(),
    currentMonth: today().getMonth(),
    currentYear: today().getFullYear(),
    display: view(),
    currentWeek: parseInt((today().getDate() + (new Date(today().getFullYear(), today().getMonth(), 1).getDay())) / 7) + 1
  },
  created: function() {
    document.addEventListener("keydown", function(e) {
      if(e.key == "ArrowRight" || e.code == "ArrowRight") {
        this.next();
      } else if (e.key == "ArrowLeft" || e.code == "ArrowLeft") {
        this.previous();
      }
    }.bind(this));

    // If the window gets to small, automatically
    // kick the user to weekly view
    window.addEventListener("resize", function(event) {
      if(jQuery(window).width() < 768) {
        this.display = "week";
      }
    }.bind(this))
  },
  computed: {
    currentMonthName: function() {
      return ["January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December"][this.currentMonth];
    },
    weeks: function() {
      var beginningOfMonth = new Date(this.currentYear, this.currentMonth, 1);
      var endOfMonth = new Date(this.currentYear, this.currentMonth + 1, 0);
      var daysInMonth = endOfMonth.getDate();
      var offset = beginningOfMonth.getDay();
      var totalWeeks = Math.ceil((daysInMonth + offset) / 7);
      return totalWeeks;
    },
  },
  methods: {
    date: function(currentMonth, week, day) {
      week = week - 1;
      var beginningOfMonth = new Date(this.currentYear, this.currentMonth, 1);
      var endOfMonth = new Date(this.currentYear, this.currentMonth + 1, 1);
      endOfMonth.setDate(-1)
      var daysInMonth = endOfMonth.getDate();
      var offset = beginningOfMonth.getDay();
      var date = ((week * 7) + day - offset + 1);
      if((week === 0 && day < offset) || (day + (week * 7) > (daysInMonth + offset - 1))) {
        if(this.display == "month") {
          return "";
        } else {
          if(date - daysInMonth < 0) {
            beginningOfMonth.setDate(0);
            return beginningOfMonth.getDate();
          } else {
            return date - daysInMonth;
          }
        }
      } else {
        return date;
      }
    },
    dateO: function(currentMonth, week, day) {
      week = week - 1;
      var beginningOfMonth = new Date(this.currentYear, this.currentMonth, 1);
      var endOfMonth = new Date(this.currentYear, this.currentMonth + 1, 1);
      endOfMonth.setDate(-1)
      var daysInMonth = endOfMonth.getDate();
      var offset = beginningOfMonth.getDay();
      var date = ((week * 7) + day - offset + 1);

      var target = new Date(this.currentYear, this.currentMonth, 1)
      target.setDate(date);
      return target;
    },
    isToday: function(date) {
      date = new Date(this.currentYear, this.currentMonth, date)
      return this.formatDate(this.today, 'short')== this.formatDate(date, 'short');
    },
    month: function(currentMonth, week, day) {
      week = week - 1;
      var beginningOfMonth = new Date(this.currentYear, this.currentMonth, 1);
      var endOfMonth = new Date(this.currentYear, this.currentMonth + 1, 0);
      var daysInMonth = endOfMonth.getDate();
      var offset = beginningOfMonth.getDay();

      if((week * 7 + day - offset + 1) > daysInMonth) {
        return currentMonth + 2;
      } else if ((week * 7 + day - offset + 1) <= 0) {
        return currentMonth;
      } else {
        return currentMonth + 1;
      }
    },
    nextMonth: function() {
      this.currentMonth++;
      if(this.currentMonth > 11) {
        this.currentMonth = 0;
        this.currentYear++;
      }
    },
    previousMonth: function() {
      this.currentMonth--;
      if(this.currentMonth < 0) {
        this.currentMonth = 11;
        this.currentYear--;
      }
    },
    goToMonth: function(month, year) {
      this.currentMonth = month;
      this.currentYear = year;
      this.setHash();
    },
    goToToday: function() {
      this.goToMonth(this.today.getMonth(), this.today.getFullYear())
      this.currentWeek = parseInt((new Date().getDate() + (new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay())) / 7) + 1;
      this.setHash();
    },
    eventsOnDay: function(date) {
      var today = new Date(this.currentYear, this.currentMonth, date);
      return this.eventsOnDate(today);
    },
    eventsOnDate: function(date) {
      var events = [];
      for(var i = 0; i < window.events.length; i++) {
        var event = window.events[i];
        if(this.eventHappensOn(event, date)) {
          events.push(event)
        }
      }
      events.sort(function(a,b) { return a.starts_at >= b.starts_at })

      return events;
    },

    eventsOnWeek: function(date) {
      // Get a list of all of the events that happen
      // in the week starting at <date>

      var weekEvents = [];
      // var sunday = new Date(this.currentYear, this.currentMonth, date);
      //   sunday.setDate(sunday.getDate() - sunday.getDay());

      var clone = function(d) {
        return new Date(
          JSON.parse(
            JSON.stringify(d)
          )
        )
      }

      for(var i=0; i<7; ++i) {
        var today = clone(date);
        today.setDate(clone(date).getDate() + i);
        weekEvents = weekEvents.concat(this.eventsOnDate(today));
      }

      // Filter out duplicates
      weekEvents = weekEvents.filter(function(value, index, self) {
        return self.indexOf(value) === index;
      })

      return weekEvents;
    },
    eventHappensOn: function(event, day) {
      var start = event.starts_at;
      var end = event.ends_at;

      return (day.getDate() >= start.getDate() && day.getMonth() >= start.getMonth() && day.getFullYear() >= end.getFullYear())
          && (day.getDate() <= end.getDate() && day.getMonth() <= end.getMonth() && day.getFullYear() <= end.getFullYear());
    },
    setHash: function() {
      var date = new Date();
      if(this.display == "month") {
        date = new Date(this.currentYear, this.currentMonth, 1);
      } else {
        date = this.dateO(this.currentMonth, this.currentWeek, 0);
      }
      var hash = moment(date).format("YYYY-MM-DD");
      window.location.href="#!" + hash;
    },
    displayMonth: function() {
      this.display = "month";
      if(window.localStorage) {
        localStorage.setItem("view", "month");
      }
    },
    displayWeek: function() {
      this.display = "week";
      localStorage.setItem("view", "week");
      if(this.today.getMonth() == this.currentMonth) {
        this.currentWeek = parseInt((today().getDate() + (new Date(today().getFullYear(), today().getMonth(), 1).getDay())) / 7);
      } else {
        this.currentWeek = 1;
      }
    },
    previous: function() {
      if(this.display == "month") {
        this.previousMonth()
      } else {
        this.previousWeek();
      }
      this.setHash();
    },
    next: function() {
      if(this.display == "month") {
        this.nextMonth();
      } else {
        this.nextWeek();
      }
      this.setHash();
    },
    nextWeek: function() {
      this.currentWeek++;
      if(this.currentWeek > (this.weeks - 1)) {
        this.currentWeek = 1;
        this.nextMonth();
      }
    },
    previousWeek: function() {
      this.currentWeek--;
      if(this.currentWeek <= 0) {
        this.previousMonth();
        this.currentWeek = this.weeks - 1;
      }
    },
    starting: function(event) {
      var timing = new Date(event.starts_at);
      return this.formatDate(timing, "h:mm a");
    },
    ending: function(event) {
      var start = new moment(event.starts_at);
      var end = new moment(event.ends_at);
      if(start.isSame(end, 'day')) {
        return this.formatDate(new Date(event.ends_at), "h:mm a")
      } else {
        return "";
      }
    },
    formatDate: function(date, format) {
      if(format === "short") {
        return date.getMonth() + 1 + "/" + date.getDate();
      } else if (format === "long") {
        return this.weekdayName(date.getDay()) + " " + (date.getMonth() + 1) + "/" + date.getDate();
      } else if (format === "longtime") {
        return this.weekdayName(date.getDay()) + " " + (date.getMonth() + 1) + "/" + date.getDate() + " at " + (date.getHours() + 1);
      } else {
        return moment(date).format(format)
      }
    },
    weekdayName: function(weekday) {
      if(weekday === 0) return "Sunday";
      if(weekday === 1) return "Monday";
      if(weekday === 2) return "Tuesday";
      if(weekday === 3) return "Wednesday";
      if(weekday === 4) return "Thursday";
      if(weekday === 5) return "Friday";
      if(weekday === 6) return "Saturday";
    }
  }
})
