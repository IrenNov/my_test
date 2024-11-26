fetch("data.json")
  .then((response) => response.json())
  .then((data) => {
    //создаем константу в которую записываем пустой элемент tbody  из html с индексом #data-table
    const tableBody = document.querySelector("#data-table tbody");

    //1. переписываем данные из массива объектов в константу remainingItems
    const remainingItems = data;

    ////////         ВЕРХНЯЯ СТРОЧКА С ВЫРУЧКОЙ

    //?????обрезаем массив входных данных на 3 элемента
    const firstThreeItems = data.slice(0, 3);

    const cashValues = data.find((item) => item.category === "Наличные").values;
    const creditValues = data.find(
      (item) => item.category === "Кредитные карты"
    ).values;
    const nonCashValues = data.find(
      (item) => item.category === "Безналичный расчет"
    ).values;
    const deliteValues = data.find(
      (item) => item.category === "Удаление из чека (после оплаты), руб"
    ).values;

    //тут функция вернула массив сумм по дням
    const dailySums = calculateDailySums(
      cashValues,
      creditValues,
      nonCashValues,
      deliteValues
    );

    const totalRowObj = {
      category: "Выручка, руб",
      values: dailySums,
    };
    const totalRow = createRow(totalRowObj, true);
    tableBody.appendChild(totalRow);

    ///////       СТРОЧКИ ТАБЛИЦЫ ИЗ ЗНАЧЕНИЙ МАССИВА

    //2. проходимся по каждому элементу массива remainingItems и создаем для каждого константу-строку, ее возвращает функция createRow
    remainingItems.forEach((item) => {
      const row = createRow(item, true);
      //3. создаем дочерний элемент для тела функции с полученной строкой
      tableBody.appendChild(row);
    });

    ////////           ФУНКЦИИ

    //2.1. сама функция создания строки из полученных данных, в качестве аргументов принимает элемент массива и булевую переменную
    function createRow(item, isClickable = false) {
      //2.2 для строки создаем константу в ней создается и записывается пустой элемент для html - строка таблицы
      const row = document.createElement("tr");
      //2.3 константа для первой ячейки строки элемент td столбец ,туда помещаем текст с значением первого ключа из принятого функцией элемента
      const categoryCell = document.createElement("td");
      categoryCell.textContent = item.category;
      //2.4 в возвращаемой строке создаем дочерний элемент со значением ячейки
      row.appendChild(categoryCell);
      let isTotalRow = false;
      if (item.category === "Выручка, руб") {
        isTotalRow = true;
      }
      //2.5 создаем константу для массива значений элемента полученного функцией
      const values = item.values;
      //2.6 создаем константы для номеров нужных индексов для таблицы
      //сначала последний индекс = длина массива минус 1
      const lastIndex = values.length - 1;
      //2.7 записываем в новые константы значения по нужным индексам зная номер последнего
      const currentValue = values[lastIndex];
      const yesterdayValue = values[lastIndex - 1];
      const lastWeekValue = values[lastIndex - 7];

      [currentValue, yesterdayValue, lastWeekValue].forEach((value, index) => {
        let previousValue = currentValue;
        let isYesterday = false;
        if (index === 1) {
          isYesterday = true;
        }
        let isLastTdTotalRow = false;
        if (isTotalRow && index === 2) {
          isLastTdTotalRow = true;
        }
        const valueCell = createValueCell(
          value,
          previousValue,
          isYesterday,
          isLastTdTotalRow
        );
        //функция вернула ячейку и ее поместили в строку
        row.appendChild(valueCell);
      });

      //отслеживаем клик по строке
      if (isClickable) {
        row.addEventListener("click", () => {
          // Удаляем предыдущий график, если он уже есть
          const existingChartRow = document.querySelector(".chart-row");
          if (existingChartRow) {
            existingChartRow.remove();
          }

          // Создаем новую строку для графика
          const chartRow = document.createElement("tr");
          chartRow.classList.add("chart-row"); // Для идентификации строки графика

          const chartCell = document.createElement("td");
          chartCell.colSpan = 4; // Объединяем 4 колонки
          chartCell.innerHTML = `<div id="chart-container" style="width: 100%; height: 300px;"></div>`;

          chartRow.appendChild(chartCell);

          // Вставляем строку с графиком сразу после текущей строки
          row.after(chartRow);

          // Рисуем график внутри контейнера
          drawChart(item.category, values.slice(-7));
        });
      }

      //возвращаемая функцией строка элемента
      return row;
    }

    ////2.1.1 функция для создания ячеек со значениями сегодня вчера и на прошлой неделе, получает аргументами по очереди сегодняшнее значение , вчерашнее и с прошлой недели и для каждого вторым аргументом получает значение сегодня и флаг isYesterday
    function createValueCell(
      value,
      previousValue,
      isYesterday = false,
      isLastTdTotalRow = false
    ) {
      //1. константа в которую помещаем созданный элемент-ячейка таблицы ее заполни и вернем
      const valueCell = document.createElement("td");

      //это если в функцию пришло значение с флагом вчера
      if (isYesterday) {
        //вычислили процент разницы с сегодня в функции
        const percentageChange = calculatePercentageChange(
          value,
          previousValue
        );

        //поместили значение вчера в span
        const valueText = document.createElement("span");
        valueText.textContent = (value ?? "-").toLocaleString("ru-RU");

        //поместили значение округленное вычесленного процента в еще один span
        const percentageText = document.createElement("span");
        percentageText.textContent = `${Math.floor(percentageChange)}%`;

        //добавляем классы для созданных спанов
        valueText.classList.add("value-text");
        percentageText.classList.add("percentage-text");
        if (percentageChange < 0) {
          percentageText.classList.add("red");
        } else if (percentageChange > 0) {
          percentageText.classList.add("green");
        } else {
          percentageText.classList.add("zero");
        }

        // теперь создаем для них оболочку div со своим классом и добавляем в него два ребенка span
        const wrapper = document.createElement("div");
        wrapper.classList.add("value-wrapper");
        wrapper.appendChild(valueText);
        wrapper.appendChild(percentageText);

        // теперь в ячейку значений добавляем эту оболочку на этом условие заканчивается
        valueCell.appendChild(wrapper);
      }
      //и теперь если это сегодня или прошлая неделя в ячейку значений помещается само значение
      else if (isLastTdTotalRow) {
        const lastSevenSum = totalRowObj["values"]
          .slice(-7)
          .reduce((sum, value) => sum + (value ?? 0), 0);
        valueCell.textContent = (lastSevenSum ?? "-").toLocaleString("ru-RU");
      } else {
        valueCell.textContent = (value ?? "-").toLocaleString("ru-RU");
      }

      //функция возвращает ячейку с текстовым значением или оболочкой
      return valueCell;
    }

    ////2.1.2 функция посчета разницы в процентах
    function calculatePercentageChange(currentValue, previousValue) {
      if (previousValue === 0) return currentValue > 0 ? 100 : -100;
      if (previousValue === undefined || currentValue === undefined) return 0;

      const percentageChange =
        ((currentValue - previousValue) / previousValue) * 100;
      return percentageChange;
    }

    ////2.1.2 функция посчета выручки за день
    function calculateDailySums(
      cashArray,
      creditArray,
      nonCashArray,
      deliteArray
    ) {
      const maxLength = Math.max(
        cashArray.length,
        creditArray.length,
        nonCashArray.length
      );

      //возвращаем массив сумм элементов  за вычетом возврата
      return Array.from({ length: maxLength }, (_, i) => {
        const cashValue = cashArray[i] ?? 0;
        const creditValue = creditArray[i] ?? 0;
        const nonCashValue = nonCashArray[i] ?? 0;
        const deliteValue = deliteArray[i] ?? 0;
        return cashValue + creditValue + nonCashValue - deliteValue;
      });
    }

    function drawChart(category, recentValues) {
      Highcharts.chart("chart-container", {
        chart: { type: "line" },
        title: { text: `${category}` },
        xAxis: {
          gridLineColor: "transperent",
          lineColor: "#333333",

          tickWidth: 5,
          tickLength: 5,
          tickColor: "#333333",
          labels: {
            enabled: false,
          },
        },
        yAxis: {
          lineWidth: 1,
          gridLineColor: "transperent",
          lineColor: "#333333",

          tickWidth: 5,
          tickLength: 5,
          tickColor: "#333333",
          labels: {
            enabled: false,
          },
          title: {
            text: null,
          },
        },
        legend: {
          enabled: false,
        },
        tooltip: {
          useHTML: true,
          formatter: function () {
            return `<strong>${category}</strong>: ${this.y}`;
          },
          backgroundColor: "#333",
          borderColor: "#000",
          style: {
            color: "#fff",
            fontSize: "12px",
          },
        },
        series: [
          {
            name: category,
            data: recentValues,
            lineWidth: 2,
            lineColor: "#217C52",
            marker: {
              symbol: "round",
              radius: 4,
              fillColor: "#217C52",
              lineWidth: 1,
              lineColor: "#217C52",
            },
          },
        ],
        credits: {
          enabled: false,
        },
      });
    }
  })
  .catch((error) => console.error("Ошибка загрузки данных:", error));
