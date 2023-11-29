function renderWordDate(element, date) {
  if (date.length > 1) {
    var startDate = new Date(date[0]);
    var endDate = new Date(date[date.length - 1]);
    var startDateStr =
      startDate.getDate() +
      " " +
      getMonthInRussian(startDate.getMonth()) +
      " " +
      startDate.getFullYear();
    var endDateStr =
      endDate.getDate() +
      " " +
      getMonthInRussian(endDate.getMonth()) +
      " " +
      endDate.getFullYear();
    element.innerText = startDateStr + " - " + endDateStr;
  } else if (date.length == 1) {
    var singleDate = new Date(date[0]);
    var singleDateStr =
      singleDate.getDate() +
      " " +
      getMonthInRussian(singleDate.getMonth()) +
      " " +
      singleDate.getFullYear();
    element.innerText = singleDateStr;
  } else {
    element.innerText = "Дата не выбрана";
  }
}

function renderTodos(element, todos, checked = false) {
  if (checked) {
    todos = todos.filter((todo) => {
      if (!todo.status) return true;
      else return false;
    });
  }
  if (todos.length > 0) {
    const todoElements = todos.map((todo) => {
      const { name, desc, status, numDate, numTime } = todo;
      return generateTodo(todo);
    });

    element.innerHTML = todoElements.join("");
    $(".todo").on("click", function () {
      $(this).toggleClass("opened");
    });
  } else {
    element.innerHTML = "Ничего не найдено";
  }
}

function getMonthInRussian(month) {
  var monthsInRussian = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ];
  return monthsInRussian[month];
}

function getTodos(callback) {
  $.ajax({
    url: "/api/todos",
    method: "get",
    dataType: "html",
    success: function (data) {
      callback(JSON.parse(data));
    },
  });
}

function generateTodo(todo) {
  const { name, desc, status, date } = todo;
  const { numDate, numTime } = date;
  const todoElement = `
      <div class="todo">
        <div class="information">
          <div class="todoTitle">${name}</div>
          <div class="todoDescription">${desc}</div>
        </div>
        <input type="checkbox" ${status ? "checked" : ""}>
        <div class="todoDate">
          <span class="date">${numDate}</span>
          <span class="time">${numTime.split(".")[0]}</span>
        </div>
      </div>
    `;
  return todoElement;
}

function getTogosByDates(dates, todos) {
  return todos.filter((todo) => dates.includes(todo.date.numDate));
}

function getTogosByName(name, todos) {
  name = name.toLowerCase();
  return todos.filter((todo) => todo.name.toLowerCase().includes(name));
}

function getWeekDates(startDate) {
  var weekDates = [];
  var currentDate = new Date(startDate);

  for (var i = 0; i < 7; i++) {
    var formattedDate =
      currentDate.getFullYear() +
      "-" +
      ("0" + (currentDate.getMonth() + 1)).slice(-2) +
      "-" +
      ("0" + currentDate.getDate()).slice(-2);
    weekDates.push(formattedDate);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return weekDates;
}

const calendarMultiply = {
  settings: {
    lang: "ru",
    range: {},
    selection: {
      day: "multiple-ranged",
    },
  },
};

const calendarSingle = {
  settings: {
    lang: "ru",
  },
};

$(document).ready(
  getTodos((todos) => {

    let currentTodos = [];
    const today = new Date().toISOString().slice(0, 10);
    const currentDay = today;
    let is_undone_checked = false;

    var todos = todos.map((todo) => {
      [numDate, numTime] = todo.date.split("T");
      return {
        name: todo.name,
        desc: todo.fullDesc,
        status: todo.status,
        date: { numDate: numDate, numTime: numTime },
      };
    });

    const shownDate = document.getElementById("todayShown");
    const todosBox = document.getElementById("content");

    const calendarActions = {
      actions: {
        clickDay(event, dates) {
          currentTodos = getTogosByDates(dates, todos);
          renderTodos(todosBox, currentTodos, is_undone_checked);
          renderWordDate(shownDate, dates);
        },
        getDays(day, date, HTMLElement, HTMLButtonElement) {
          todosInThisDay = getTogosByDates(date, todos);
          HTMLButtonElement.style.flexDirection = "column";
          if (todosInThisDay.length > 0)
            HTMLButtonElement.innerHTML = `
                  <span>${day}</span>
                  <span style="font-size: 1em;color: #9492ff;">${todosInThisDay.length}</span>
                `;
        },
      },
    };

    const calendarSingleOptions = {
      ...calendarSingle,
      ...calendarActions,
    };
    const calendar = new VanillaCalendar(
      "#sidebarCalendar",
      calendarSingleOptions
    );
    calendar.init();
  
  
    $(document).keydown(function (event) {
      if (event.which === 16) {
        calendar.settings.selection.day = "multiple-ranged";
        calendar.update();
      }
    });

    $(document).keyup(function (event) {
      if (event.which === 16) {
        calendar.settings.selection.day = "single";
        calendar.update();
      }
    });

    $("#searcher_input").on("input", function (event) {
      let inputValue = event.target.value;
      currentTodos = getTogosByName(inputValue, todos);
      if (currentTodos) renderTodos(todosBox, currentTodos, is_undone_checked);
      else {
        currentTodos = getTogosByDates([today], todos)
        renderTodos(
          todosBox,
          currentTodos,
          is_undone_checked
        );
      }
    });

    $("#today").on("click", function () {
      calendar.settings.selected.dates = [today];
      calendar.update();
      currentTodos = getTogosByDates([today], todos);
      renderWordDate(shownDate, [today]);
      renderTodos(todosBox, currentTodos, is_undone_checked);
      calendar.settings.selected.dates = [];
    });

    $("#week").on("click", function () {
      calendar.settings.selected.dates = getWeekDates(today);
      calendar.update();
      currentTodos = getTogosByDates(calendar.settings.selected.dates, todos);
      renderWordDate(shownDate, calendar.settings.selected.dates);
      renderTodos(todosBox, currentTodos, is_undone_checked);
      calendar.settings.selected.dates = [];
    });

    $("#undone_checkbox_input").click(function () {
      if ($(this).is(":checked")) {
        is_undone_checked = true;
      } else {
        is_undone_checked = false;
      }
      renderTodos(todosBox, currentTodos, is_undone_checked);
    });

    $("#sort").click(function () {
      currentTodos.sort(function (a, b) {
        return a.date.numDate - b.date.numDate;
      });
      renderTodos(todosBox, currentTodos, is_undone_checked);
    });

    currentTodos = getTogosByDates([today], todos);
    renderTodos(todosBox, currentTodos);
    renderWordDate(shownDate, [today]);
  })
);
