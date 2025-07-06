import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import Chart from "chart.js/auto";

const ProgressChart = forwardRef((_, ref) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [data, setData] = useState({ todo: 0, inProgress: 0, done: 0 });

  const fetchData = async () => {
    const res = await fetch("http://localhost:5000/api/kanban-tasks");
    const tasks = await res.json();

    const grouped = {
      todo: 0,
      inProgress: 0,
      done: 0,
    };

    tasks.forEach((task) => {
      grouped[task.status]++;
    });

    setData(grouped);
  };

  useImperativeHandle(ref, () => ({
    refreshChart: fetchData,
  }));

  useEffect(() => {
    fetchData();
    const listener = () => fetchData();
    window.addEventListener("task-status-updated", listener);

    return () => {
      window.removeEventListener("task-status-updated", listener);
    };
  }, []);

  useEffect(() => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    chartInstanceRef.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["To Do", "In Progress", "Done"],
        datasets: [
          {
            label: "Tasks",
            data: [data.todo, data.inProgress, data.done],
            backgroundColor: ["#f87171", "#fbbf24", "#34d399"],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: { padding: 20 },
          },
        },
      },
    });
  }, [data]);

  return (
    <div style={{ width: "350px",
      height:"350px",
     margin: "60px auto",
      }}>
      
      <canvas ref={chartRef} />
    </div>
  );
});

export default ProgressChart;
