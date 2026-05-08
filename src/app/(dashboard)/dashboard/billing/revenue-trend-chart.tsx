"use client";

import React from "react";
import { useEffect, useRef } from "react";
import { Chart, type ChartConfiguration } from "chart.js/auto";

type Props = {
  labels: string[];
  values: number[];
};

export function RevenueTrendChart({ labels, values }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const config: ChartConfiguration<"line"> = {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Revenue (RON)",
            data: values,
            borderColor: "#fbbf24",
            backgroundColor: "rgba(251, 191, 36, 0.18)",
            fill: true,
            tension: 0.25,
            pointRadius: 3,
            pointHoverRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: "rgba(63,63,70,0.35)" },
            ticks: { color: "#a1a1aa" }
          },
          y: {
            grid: { color: "rgba(63,63,70,0.35)" },
            ticks: { color: "#a1a1aa" }
          }
        },
        plugins: {
          legend: { labels: { color: "#e4e4e7" } }
        }
      }
    };

    const chart = new Chart(canvasRef.current, config);
    return () => chart.destroy();
  }, [labels, values]);

  return (
    <div className="h-72 w-full">
      <canvas ref={canvasRef} />
    </div>
  );
}