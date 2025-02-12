import { useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { CoinData } from '../../services/CryptoService';
import { ApexOptions } from 'apexcharts';

interface CustomChartWidgetProps {
    data: CoinData[];
    timeFilter?: '1H' | '1D' | '1W' | '1M' | '1Y';
    onDataPointHover?: (price: number, timestamp: number) => void;
    isLoading: boolean;
    setIsLoading: (option:boolean)=>void
}

type ChartType = 'candlestick' | 'line';

const CustomChartWidget = ({ data, isLoading , setIsLoading}: CustomChartWidgetProps) => {
    const [chartType, setChartType] = useState<ChartType>('candlestick');

    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        if (chartType === 'candlestick') {
            return [{
                name: 'Price',
                data: data.map(point => ({
                    x: new Date(point.time * 1000).getTime(), 
                    y: [
                        Number(point.open),
                        Number(point.high),
                        Number(point.low),
                        Number(point.close)
                    ]
                }))
            }];
        } else {
            return [{
                name: 'Price',
                data: data.map(point => ({
                    x: new Date(point.time * 1000).getTime(), 
                    y: Number(point.close)
                }))
            }];
        }
    }, [data, chartType]);

    const options: ApexOptions = useMemo(() => ({
        chart: {
            type: chartType,
            height: 500,
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
            },
            toolbar: {
                show: false,
                tools: {
                    download: false,
                    selection: false,
                    zoom: false,
                    zoomin: false,
                    zoomout: false,
                    pan: false,
                    reset: false
                },
            },
            fontFamily: 'Outfit',
            dropShadow: {
                enabled: true,
                top: 3,
                left: 2,
                blur: 4,
                opacity: 0.2
            }
        },
        stroke: {
            curve: 'smooth',
            width: chartType === 'line' ? 2.5 : 1,
            lineCap: 'round',
            colors: chartType === 'line' ? undefined : ['#22c55e', '#ef4444']
        },
        fill: {
            type: chartType === 'line' ? 'gradient' : 'solid',
            gradient: {
                shade: 'dark',
                type: "vertical",
                shadeIntensity: 0.5,
                gradientToColors: ['#22c55e'],
                inverseColors: true,
                opacityFrom: 0.8,
                opacityTo: 0.2,
                stops: [0, 100],
                colorStops: [{
                    offset: 0,
                    color: "#22c55e",
                    opacity: 0.6
                },
                {
                    offset: 100,
                    color: "#22c55e",
                    opacity: 0
                }]
            }
        },
        xaxis: {
            type: 'datetime',
            labels: {
                datetimeUTC: false,
            }
        },
        yaxis: {
            tooltip: {
                enabled: true
            },
            labels: {
                formatter: (value) => value.toFixed(2)
            }
        },
        plotOptions: {
            candlestick: {
                colors: {
                    upward: '#22c55e',
                    downward: '#ef4444'
                },
                wick: {
                    useFillColor: true,
                }
            
            }
        },
        tooltip: {
            enabled: true,
            theme: 'dark',
            x: {
                format: 'MMM dd HH:mm'
                
            },
            style: {
                fontSize: '10px',
                fontFamily: 'Outfit'
            },
            marker: {
                show: true,
            },
        },
        grid: {
            borderColor: '#262626',
            strokeDashArray: 3,
            xaxis: {
                lines: {
                    show: true
                }
            },
            yaxis: {
                lines: {
                    show: true
                }
            }
        },
        colors: ['#22c55e'], 
        legend: {
            show: false
        },
    }), [chartType]);

    const handleChartTypeChange = () => {
        setIsLoading(true);
        setTimeout(() => {
            setChartType(prev => prev === 'candlestick' ? 'line' : 'candlestick');
            setTimeout(() => {
                setIsLoading(false);
            }, 300); 
        }, 200);
    };

    if (isLoading) {
        return (
            <div className="w-full h-[250px] flex items-center justify-center ">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return (
        <div className="w-full h-full">
            <div className="flex justify-end mb-4">
                <button
                    onClick={handleChartTypeChange}
                    className=" gradient-background transition-colors flex items-center gap-2 text-xs !p-2"
                    aria-label={`Switch to ${chartType === 'candlestick' ? 'line' : 'candlestick'} chart`}
                >
                    <i className={`fi fi-rr-${chartType === 'candlestick' ? 'chart-line-up' : 'chart-candlestick'}`}></i>
                    {chartType === 'candlestick' ? 'Line' : 'Candlestick'}
                </button>
            </div>
            <ReactApexChart
            
                options={options}
                series={chartData}
                type={chartType}
                height={250}
            />
        </div>
    );
};

export default CustomChartWidget; 