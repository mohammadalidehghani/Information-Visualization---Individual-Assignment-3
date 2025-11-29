// ------- Chart Setup -------
const margin = { top: 40, right: 30, bottom: 80, left: 70 };
const width = 900 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// tooltip div (already exists in HTML)
const tooltip = d3.select("#tooltip");

// CSV file path
const filePath = "data/youth_data.csv";

const selectedYear = 2024;
const keys = ["Smoking_Prevalence", "Drug_Experimentation"];

// desired order of age groups on the x-axis
const AGE_ORDER = [
  "10-14",
  "15-19",
  "20-24",
  "25-29",
  "30-39",
  "40-49",
  "50-59",
  "60-69",
  "70-79",
  "80+"
];

// ------- Load CSV -------
d3.csv(filePath).then(data => {

  data.forEach(d => {
    d.Year = +d.Year;
    d.Smoking_Prevalence = +d.Smoking_Prevalence;
    d.Drug_Experimentation = +d.Drug_Experimentation;
  });

  // filter by selected year
  let filtered = data.filter(d => d.Year === selectedYear);

  // Age groups that actually exist in this year, in the desired order
  const ageGroups = AGE_ORDER.filter(age =>
    filtered.some(d => d.Age_Group === age)
  );

  // ------- X scales -------
  const x0 = d3.scaleBand()
    .domain(ageGroups)
    .range([0, width])
    .padding(0.2);

  const x1 = d3.scaleBand()
    .domain(keys)
    .range([0, x0.bandwidth()])
    .padding(0.1);

  // ------- Y scale -------
  const y = d3.scaleLinear()
    .domain([
      0,
      d3.max(filtered, d =>
        Math.max(d.Smoking_Prevalence, d.Drug_Experimentation)
      )
    ])
    .nice()
    .range([height, 0]);

  // ------- Colors -------
  const color = d3.scaleOrdinal()
    .domain(keys)
    .range(["#1f77b4", "#ff7f0e"]);

  // ------- Draw Bars with animation, tooltip, highlight -------

  // create one group per age group
  const groups = svg.append("g")
    .selectAll("g")
    .data(ageGroups)
    .enter()
    .append("g")
    .attr("transform", d => `translate(${x0(d)},0)`);

  // create bars inside each group
  const bars = groups.selectAll("rect")
    .data(ageGroup => {
      const row = filtered.find(d => d.Age_Group === ageGroup);
      return keys.map(key => ({
        key,
        value: row ? row[key] : 0,
        ageGroup
      }));
    })
    .enter()
    .append("rect")
    .attr("x", d => x1(d.key))
    .attr("width", x1.bandwidth())
    // start animation from zero height
    .attr("y", y(0))
    .attr("height", height - y(0))
    .attr("fill", d => color(d.key))
    .attr("opacity", 0.9);

  // animation: grow bars from bottom
  bars.transition()
    .duration(800)
    .attr("y", d => y(d.value))
    .attr("height", d => height - y(d.value));

  // hover interactions: tooltip + highlight
  bars
    .on("mouseover", (event, d) => {
      // dim all bars
      bars.attr("opacity", 0.3);

      // highlight current bar
      d3.select(event.currentTarget)
        .attr("opacity", 1.0)
        .attr("stroke", "#000")
        .attr("stroke-width", 1.5);

      const label =
        d.key === "Smoking_Prevalence"
          ? "Smoking prevalence"
          : "Drug experimentation";

      tooltip
        .style("opacity", 1)
        .html(
          `<strong>${d.ageGroup}</strong><br>${label}: ${d.value.toFixed(1)}%`
        )
        .style("left", event.pageX + 12 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", event.pageX + 12 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", () => {
      // reset all bars
      bars
        .attr("opacity", 0.9)
        .attr("stroke", "none");

      tooltip.style("opacity", 0);
    });

  // ------- Axes -------
  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x0))
    .selectAll("text")
    .attr("transform", "rotate(-30)")
    .style("text-anchor", "end");

  svg.append("g")
    .call(d3.axisLeft(y));

  // ------- Axis Label -------
  svg.append("text")
    .attr("x", -height / 2)
    .attr("y", -50)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .text("Rate (%)");

  // ------- Legend -------
  const legend = svg.append("g")
    .attr("transform", `translate(${width - 200}, 0)`);

  keys.forEach((key, i) => {
    const g = legend.append("g")
      .attr("transform", `translate(0, ${i * 25})`);

    g.append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", color(key));

    g.append("text")
      .attr("x", 25)
      .attr("y", 14)
      .text(key.replace("_", " "));
  });

}).catch(error => {
  console.error("Error loading CSV:", error);
});
