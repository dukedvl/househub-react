import logo from './logo.svg';
import { DateTime, Duration, Interval } from "luxon";
import './App.css';
import { useState, useEffect } from 'react';

function App() {

  const [hourly, setHourly] = useState([]);
  const [daily, setDaily] = useState([]);

  const [dailyMedian, setDailyMedian] = useState(0);
  const [dailyHigh, setDailyHigh] = useState(0);
  const [dailyLow, setDailyLow] = useState(0);

  const [today, setToday]=useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    await getDaily();
    await getWeather();
  }

  async function getWeather() {
    var requestOptions = {
      method: 'get'
    };

    const resp = await fetch("http://192.168.1.16:3031/forecast/hourly", requestOptions);

    if (!resp.ok) {
      const msg = `Shit happened: ${resp.status} ${await resp.text()}`;
      throw new Error(msg);
    }

    const weatherdata = await resp.json();

    setHourly(weatherdata);
    const dailyTemps = weatherdata.map(t => t.temp);

    setDailyHigh(Math.max.apply(Math, dailyTemps));
    setDailyLow(Math.min.apply(Math, dailyTemps));
    setDailyMedian(dailyTemps.reduce((a, b) => a + b, 0) / dailyTemps.length);

  }

  async function getDaily() {
    var requestOptions = {
      method: 'get'
    };

    const resp = await fetch("http://192.168.1.16:3031/forecast/daily", requestOptions);

    if (!resp.ok) {
      const msg = `Shit happened: ${resp.status} ${await resp.text()}`;
      throw new Error(msg);
    }

    const weatherdata = await resp.json();
    setDaily(weatherdata);

    setToday(weatherdata.filter(day=> DateTime.fromISO(day.weather_time).hasSame(DateTime.now(), 'day'))[0]);

    console.log(JSON.stringify(weatherdata));
  }

  function getDisplayString(string) {
    return string.replace("_", " ");
  }

  function getWeatherImg(conditions, timeOfDay) {

    //return "assets/001-sunny.png";
    let dayTime = true;

    if (timeOfDay != null && today!=null) {
      let hour = DateTime.fromISO(timeOfDay).hour;
      dayTime = hour > DateTime.fromISO(today.sunrise_time).hour && hour < DateTime.fromISO(today.sunset_time).hour;
    }

    conditions = conditions.toLowerCase();

    if (conditions.includes("partly") || conditions.includes("mostly")) {
      return dayTime ? "assets/011-sunny.png" : "assets/013-full moon.png";
    }
    else if (conditions.includes("cloud")) {
      return dayTime ? "assets/002-cloud.png" : "assets/013-full moon.png";
    }

    if (conditions.includes("rain") || conditions.includes("drizzle")) {
      return "assets/004-rain.png";
    }

    if (conditions.includes("fog")) {
      return dayTime ? "assets/019-fog.png" : "assets/029-full moon.png";
    }

    if (conditions.includes("snow") || conditions.includes("flurries")) {
      return "assets/007-snow.png";
    }

    if (conditions.includes("wind")) {
      return "assets/012-windy.png";
    }

    if (conditions.includes("hail")) {
      return "assets/014-hail.png";
    }

    if (conditions.includes("sleet")) {
      return "assets/027-sleet.png";
    }

    if (conditions.includes("storm")) {
      return "assets/006-thunder.png";
    }

    return dayTime ? "assets/001-sunny.png" : "assets/008-full moon.png";
    
  }

  function getDailyHiLowGradient(temp) {
    if (temp === dailyHigh) {
      return "#f29e66";
    }

    if (temp === dailyLow) {
      return "#35d7f0";
    }

    if (temp < dailyMedian) {
      return "#aff0fa";
    }

    if (temp > dailyMedian) {
      return "#fcddb6";
    }

    return "#ffffff";
  }

  function getMoonImg(phase) {
    switch(phase)
    {
        case "new":
          return "assets/new-moon-phase-circle.png";
        case "Waxing_Crescent":
          return "assets/moon-phase-interface-symbol.png";
        case "First_Quarter":
          return "assets/half-moon-phase-symbol.png";
        case "Waxing_Gibbous":
          return "assets/moon-phase-symbol-9.png";
        case "Full":
          return "assets/moon-phase.png";
        case "Waning_Gibbous":
          return "assets/moon-phase-symbol-14.png";
        case "Third_Quarter":
          return "assets/moon-phase-symbol-3.png";
        case "Waning_Crescent":
          return "assets/moon-phase-symbol-12.png";
        default:
          return "assets/new-moon-phase-circle.png";
    };
    
  }

  return (
    <div className="App">
      <h1>Weather Data</h1>
      <table align="center" cellPadding="20">
        <tr>
          <td style={{ verticalAlign: "top" }}>

            {/*Daily Table*/}
            <table cellPadding="10" border="1" >
              <thead>
                <tr><th colSpan="4">7-day Forecast</th></tr>
                <tr>
                  <th>Day</th>
                  <th>Hi-Lo</th>
                  <th>Weather</th>
                  <th>Moon</th>
                </tr>
              </thead>
              <tbody>
                {
                  daily.map((thing) => {
                    return <tr>
                      <td>{new Date(thing.weather_time).toLocaleDateString("en-us", { weekday: 'short', month: 'numeric', day: 'numeric' })}</td>
                      <td>{thing.high} F - {thing.low} F</td>
                      <td><img src={getWeatherImg(thing.weather_code)} height="24" width="24" style={{ float: "left", margin: "0px 15px 0px 5px" }} /> {getDisplayString(thing.weather_code)}</td>
                      <td><img src={getMoonImg(thing.moon_phase)} height="24" width="24" style={{ float: "left", margin: "0px 15px 0px 5px" }} /> {getDisplayString(thing.moon_phase)}</td>
                    </tr>;
                  })
                }
              </tbody>
            </table>
          </td>

          <td>
            {/*Hourly Table*/}
            <table cellPadding="10" border="1" >
              <thead>
                <tr><th colSpan="7">Hourly (24h)
                {(()=>{

                    const sunRiseTime = DateTime.fromISO(today.sunrise_time);
                    const sunSetTime = DateTime.fromISO(today.sunset_time);
                    const duration = Interval.fromDateTimes(sunRiseTime,sunSetTime).length('minutes');
                    let durationStr = `${(duration /60).toFixed()}h ${duration%60}m`;
                    return <span style={{ color: "black", fontSize: "small", float: "right" }}><span style={{ color: "dimgrey", fontSize: "xx-small" }}>{durationStr}</span>  <img src="assets/015-sunrise.png" height="25" width="25" /> {sunRiseTime.toLocaleString(DateTime.TIME_SIMPLE)} <img src="assets/016-sunset.png" height="25" width="25" /> {sunSetTime.toLocaleString(DateTime.TIME_SIMPLE)} </span>;
                  })()
              }
              </th></tr>
                <tr>
                  <th>Hour</th>
                  <th>Temp</th>
                  <th>Weather</th>
                  <th>Feel</th>
                 {/*<th>Precipitation</th>*/}
                  <th>Humidity</th>
                  <th>Dew Point</th>
                </tr>
              </thead>
              <tbody>
                {
                  hourly.map((thing) => {
                    return <tr>
                      <td>{new Date(thing.weather_time).toLocaleTimeString("en-us", { hour: "2-digit", minute: "2-digit" })}</td>
                      <td bgcolor={getDailyHiLowGradient(thing.temp)}>{thing.temp} F</td>
                      <td><img src={getWeatherImg(thing.weather_code, thing.weather_time)} height="24" width="24" style={{ float: "left", margin: "0px 15px 0px 5px" }} /> {getDisplayString(thing.weather_code)}</td>
                      <td bgcolor={getDailyHiLowGradient(thing.temp)}>{thing.feels_like} F</td>
                      {/*<td>{thing.precipitation_chance}% chance of {thing.precipitation_type}</td>*/}
                      <td>{thing.humidity}%</td>
                      <td>{thing.dew_point}F</td>
                    </tr>;
                  })
                }
              </tbody>
            </table>
          </td>
        </tr>
      </table>
      <div> Weather icons made by <a href="https://www.flaticon.com/authors/smashicons" title="Smashicons">Smashicons</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
<div>Moon icons made by <a href="https://www.flaticon.com/authors/freepik" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
    </div>
  );




}

export default App;
