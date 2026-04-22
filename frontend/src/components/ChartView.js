import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

function ChartView({ data }) {
  const chartData = Object.keys(data).map((key) => ({
    group: key,
    selection_rate: data[key].selection_rate,
  }));

  return (
    <BarChart width={300} height={200} data={chartData}>
      <XAxis dataKey="group" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="selection_rate" />
    </BarChart>
  );
}

export default ChartView;