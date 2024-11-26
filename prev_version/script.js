fetch("data.json")
  .then((response) => response.json())
  .then((data) => {
    const tableBody = document.querySelector("#data-table tbody");

    let totalCurrent = 0;
    let totalYesterday = 0;
    let totalLastWeek = 0;

    const firstThreeItems = data.slice(0, 3);

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
      return Array.from({ length: maxLength }, (_, i) => {
        const cashValue = cashArray[i] ?? 0;
        const creditValue = creditArray[i] ?? 0;
        const nonCashValue = nonCashArray[i] ?? 0;
        const deliteValue = deliteArray[i] ?? 0;
        return cashValue + creditValue + nonCashValue - deliteValue;
      });
    }

    function calculatePercentageChange(currentValue, previousValue) {
      if (previousValue === 0) return currentValue > 0 ? 100 : -100;
      if (previousValue === undefined || currentValue === undefined) return 0;

      const percentageChange =
        ((currentValue - previousValue) / previousValue) * 100;
      return percentageChange;
    }
    function createValueCell(value, previousValue, isYesterday = false) {
      const valueCell = document.createElement("td");
      if (isYesterday) {
        const percentageChange = calculatePercentageChange(
          value,
          previousValue
        );

        const valueText = document.createElement("span");
        valueText.textContent = (value ?? "-").toLocaleString("ru-RU");

        const percentageText = document.createElement("span");
        percentageText.textContent = ` ${Math.floor(percentageChange)}%`;

        valueText.classList.add("value-text");
        percentageText.classList.add("percentage-text");
        if (percentageChange < 0) {
          percentageText.classList.add("red");
        } else if (percentageChange > 0) {
          percentageText.classList.add("green");
        } else {
          percentageText.classList.add("zero");
        }

        const wrapper = document.createElement("div");
        wrapper.classList.add("value-wrapper");
        wrapper.appendChild(valueText);
        wrapper.appendChild(percentageText);

        valueCell.appendChild(wrapper);
      } else {
        valueCell.textContent = (value ?? "-").toLocaleString("ru-RU");
      }
      return valueCell;
    }

    function createRow(item, isClickable = false) {
      const row = document.createElement("tr");

      const categoryCell = document.createElement("td");
      categoryCell.textContent = item.category;
      row.appendChild(categoryCell);

      const values = item.values;
      const lastIndex = values.length - 1;
      const currentValue = values[lastIndex];
      const yesterdayValue = values[lastIndex - 1];
      const lastWeekValue = values[lastIndex - 7];

      [currentValue, yesterdayValue, lastWeekValue].forEach((value, index) => {
        let previousValue = currentValue;
        let isYesterday = false;

        if (index === 1) {
          previousValue = currentValue;
          isYesterday = true;
        }

        const valueCell = createValueCell(value, previousValue, isYesterday);
        row.appendChild(valueCell);
      });

      if (isClickable) {
        row.addEventListener("click", () => {
          drawChart(item.category, values.slice(-7));
        });
      }

      return row;
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

    const dailySums = calculateDailySums(
      cashValues,
      creditValues,
      nonCashValues,
      deliteValues
    );

    const totalRow = document.createElement("tr");
    totalRow.classList.add("total-row");

    const sumLabelCell = document.createElement("td");
    sumLabelCell.textContent = "Выручка, руб.";
    totalRow.appendChild(sumLabelCell);

    const indices = [dailySums.length - 1, dailySums.length - 2];

    indices.forEach((index) => {
      const totalCell = document.createElement("td");

      totalCell.textContent = (dailySums[index] ?? 0).toLocaleString("ru-RU");
      totalRow.appendChild(totalCell);
    });

    const lastSevenSum = dailySums
      .slice(-7)
      .reduce((sum, value) => sum + (value ?? 0), 0);

    const totalCell = document.createElement("td");
    totalCell.textContent = lastSevenSum.toLocaleString("ru-RU");
    totalRow.appendChild(totalCell);

    tableBody.appendChild(totalRow);

    tableBody.appendChild(totalRow);

    const chartRow = document.createElement("tr");
    const chartCell = document.createElement("td");
    chartCell.colSpan = 4;
    chartCell.innerHTML = `<div id="chart-container" style="width: 100%; height: 300px;"></div>`;
    chartRow.appendChild(chartCell);
    tableBody.appendChild(chartRow);

    drawChart("Выручка, руб", dailySums.slice(-7));

    firstThreeItems.forEach((item) => {
      const row = createRow(item, true);
      tableBody.appendChild(row);
    });

    const remainingItems = data.slice(3);
    remainingItems.forEach((item) => {
      const row = createRow(item, true);
      tableBody.appendChild(row);
    });
  })
  .catch((error) => console.error("Ошибка загрузки данных:", error));
