const apiKey = "key=e4a4d1dc17cd4a44a4f64954241009";

const realTimeWeatherAPIBaseURL = "https://api.weatherapi.com/v1/current.json?"
const historyWeatherAPIBaseURL = "https://api.weatherapi.com/v1/history.json?"
const forecastWeatherAPIBaseURL = "https://api.weatherapi.com/v1/forecast.json?"
const astronomyAPIBaseURL = "https://api.weatherapi.com/v1/astronomy.json?"
const searchAPIBaseURL = "https://api.weatherapi.com/v1/search.json?"

let forecastDaysRequired = 5;
let historyDaysRequired = 5;

// API DATA HANDLERS

let currentWeatherData;
let forecastWeatherData;

let historyWeatherData;
let historyWeatherDataCelciusArray = [];
let historyWeatherDataFahrenheitArray = [];

let currentWeatherHero;

// VARIABLES

let locationArray = [];
let isTempToggled = false;

const today = new Date();
const currentDate = today.toISOString().split('T')[0];

let datalistOptions = document.getElementById("datalistOptions");
const weatherStateImgContainer = document.getElementById("weatherStateImgContainer");


// =================================================================
// ===================COUNTRIES & CITIES LOAD=======================
// =================================================================

async function loadLocations() {
    let input = event.target.value;
    datalistOptions.replaceChildren();
    await callSearchApi(input);

    locationArray.forEach(element => {
        let item = `<option value="${element}">`;
        datalistOptions.innerHTML += item;
    });
}

async function callSearchApi(input) {
    await fetch(searchAPIBaseURL + apiKey + `&q=${input}`)
        .then(res => res.json())
        .then(data => {
            locationArray = [];
            if (data.length > 0) {
                data.forEach(element => {
                    locationArray.push(`${element.name} - ${element.country}`);
                });
            }
        })
}

// =================================================================
// ===================GET & SET LOCATION NAME=======================
// =================================================================

function saveLocation() {
    let location = document.getElementById("input").value;
    if (location) {
        sessionStorage.setItem("location", location);
        return true;
    } else {
        return false;
    }
}

function btnSearch() {
    if (saveLocation()) {
        let temp = sessionStorage.getItem("location");
        fetch(realTimeWeatherAPIBaseURL + apiKey + `&q=${temp}`)
            .then(res => {
                if (!res.ok) {
                    handleAPIErrors(res);
                    resetForm();
                    return;
                } else {
                    window.location.href = 'report.html';
                }
            })
    }
}

// =================================================================
// ========================RESET INPUT==============================
// =================================================================

function resetForm() {
    let input = document.getElementById("input");
    if (input.value != null) {
        input.value = "";
    }
}

// =================================================================
// ====================HANDLING WEATHER DATA========================
// =================================================================

async function callWeatherApiReport() {
    let currentLocation = sessionStorage.getItem("location");

    try {
        await callRealTimeWeatherAPI(currentLocation);
        await callAstronomyAPI(currentLocation);
        await callForecastAPI(currentLocation);
        await callHistoryAPIHandler(currentLocation);

    } catch (error) {
        console.error('Error occurred:', error);
    } finally {
        if (document.getElementById("loading")) {
            hideLoading();
        }
    };
}

async function callRealTimeWeatherAPI(currentLocation) {
    try {
        await fetch(realTimeWeatherAPIBaseURL + apiKey + `&q=${currentLocation}&aqi=yes`)
            .then(res => {
                if (!res.ok) {
                    handleAPIErrors(res);
                    throw new Error('API request failed');
                }
                return res.json();
            })
            .then(data => {
                currentWeatherData = data;

                weatherStateImgContainer.addEventListener('load', () => {
                    weatherStateImgContainer.style.background = `url(${getWeatherImgHero(currentWeatherData.current.condition.code)})`;
                    weatherStateImgContainer.style.backgroundSize = `cover`;
                    weatherStateImgContainer.style.backgroundRepeat = `no-repeat`;
                    weatherStateImgContainer.style.backgroundPosition = `bottom`;
                });

                document.getElementById("currentWeatherImg").src = `${getWeatherImgIcon(currentWeatherData.current.condition.code, currentWeatherData.current.is_day)}`
                document.getElementById("country").innerText = currentWeatherData.location.country;
                document.getElementById("locationName").innerText = currentWeatherData.location.name;
                document.getElementById("localTime").innerText = currentWeatherData.location.localtime.slice(-5);


                document.getElementById("currentTemperatureValue").innerText = Math.round(currentWeatherData.current.temp_c) + `\u00B0`
                document.getElementById("temperatureUnit").innerText = "C";

                document.getElementById("currentFeelsLikeValue").innerText = Math.round(currentWeatherData.current.feelslike_c) + `\u00B0`
                document.getElementById("currentFeelsLikeValueUnit").innerText = "C";

                document.getElementById("currentWeatherDescription").innerText = currentWeatherData.current.condition.text;

                measureAirQuality(currentWeatherData.current.air_quality[`us-epa-index`]);

                document.getElementById("carbonMonoxideIndex").innerText = Math.round(currentWeatherData.current.air_quality.co);
                document.getElementById("nitrogenDioxideIndex").innerText = Math.round(currentWeatherData.current.air_quality.no2);
                document.getElementById("ozoneIndex").innerText = Math.round(currentWeatherData.current.air_quality.o3);

                document.getElementById("currentHumidityValue").innerText = Math.round(currentWeatherData.current.humidity) + `%`

                document.getElementById("currentPressureValue").innerText = Math.round(currentWeatherData.current.pressure_mb) + ` hPa`

                document.getElementById("currentVisibilityValue").innerText = Math.round(currentWeatherData.current.vis_km) + ` Km`

                document.getElementById("currentVisibilityValue").innerText = Math.round(currentWeatherData.current.vis_km) + ` Km`
            })
    } catch (error) {
        console.error('Error in callRealTimeWeatherAPI:', error);
    }
}

async function callAstronomyAPI(currentLocation) {
    try {
        await fetch(astronomyAPIBaseURL + apiKey + `&q=${currentLocation}&dt=${currentDate}`)
            .then(res => {
                if (!res.ok) {
                    handleAPIErrors(res);
                    throw new Error('API request failed');
                }
                return res.json();
            })
            .then(data => {
                document.getElementById("sunriseTime").innerText = data.astronomy.astro.sunrise;
                document.getElementById("sunsetTime").innerText = data.astronomy.astro.sunset;
            })
    } catch (error) {
        console.error('Error in callAstronomyAPI:', error);
    }
}

async function callForecastAPI(currentLocation) {
    try {
        await fetch(forecastWeatherAPIBaseURL + apiKey + `&q=${currentLocation}&days=${forecastDaysRequired}&alerts=yes`)
            .then(res => {
                if (!res.ok) {
                    handleAPIErrors(res);
                    throw new Error('API request failed');
                }
                return res.json();
            })
            .then(data => {
                forecastWeatherData = data;
                {
                    let temp = forecastWeatherData.forecast.forecastday[0];

                    document.getElementById("todayAt12AMWeatherImg").src = `${getWeatherImgIcon(temp.hour[0].condition.code, temp.hour[0].is_day)}`
                    document.getElementById("todayAt03AMWeatherImg").src = `${getWeatherImgIcon(temp.hour[3].condition.code, temp.hour[3].is_day)}`
                    document.getElementById("todayAt06AMWeatherImg").src = `${getWeatherImgIcon(temp.hour[6].condition.code, temp.hour[6].is_day)}`
                    document.getElementById("todayAt09AMWeatherImg").src = `${getWeatherImgIcon(temp.hour[9].condition.code, temp.hour[9].is_day)}`
                    document.getElementById("todayAt12PMWeatherImg").src = `${getWeatherImgIcon(temp.hour[12].condition.code, temp.hour[12].is_day)}`
                    document.getElementById("todayAt03PMWeatherImg").src = `${getWeatherImgIcon(temp.hour[15].condition.code, temp.hour[15].is_day)}`
                    document.getElementById("todayAt06PMWeatherImg").src = `${getWeatherImgIcon(temp.hour[18].condition.code, temp.hour[18].is_day)}`
                    document.getElementById("todayAt09PMWeatherImg").src = `${getWeatherImgIcon(temp.hour[21].condition.code, temp.hour[21].is_day)}`

                    document.getElementById("todayAt12AMTempValue").innerText = Math.round(temp.hour[0].temp_c) + `\u00B0`
                    document.getElementById("todayAt03AMTempValue").innerText = Math.round(temp.hour[3].temp_c) + `\u00B0`
                    document.getElementById("todayAt06AMTempValue").innerText = Math.round(temp.hour[6].temp_c) + `\u00B0`
                    document.getElementById("todayAt09AMTempValue").innerText = Math.round(temp.hour[9].temp_c) + `\u00B0`
                    document.getElementById("todayAt12PMTempValue").innerText = Math.round(temp.hour[12].temp_c) + `\u00B0`
                    document.getElementById("todayAt03PMTempValue").innerText = Math.round(temp.hour[15].temp_c) + `\u00B0`
                    document.getElementById("todayAt06PMTempValue").innerText = Math.round(temp.hour[18].temp_c) + `\u00B0`
                    document.getElementById("todayAt09PMTempValue").innerText = Math.round(temp.hour[21].temp_c) + `\u00B0`

                    document.getElementById("todayAt12AMTempUnit").innerText = "C";
                    document.getElementById("todayAt03AMTempUnit").innerText = "C";
                    document.getElementById("todayAt06AMTempUnit").innerText = "C";
                    document.getElementById("todayAt09AMTempUnit").innerText = "C";
                    document.getElementById("todayAt12PMTempUnit").innerText = "C";
                    document.getElementById("todayAt03PMTempUnit").innerText = "C";
                    document.getElementById("todayAt06PMTempUnit").innerText = "C";
                    document.getElementById("todayAt09PMTempUnit").innerText = "C";

                    document.getElementById("todayAt12AMWindSpeed").innerText = Math.round(temp.hour[0].wind_kph) + ` km/h`
                    document.getElementById("todayAt03AMWindSpeed").innerText = Math.round(temp.hour[3].wind_kph) + ` km/h`
                    document.getElementById("todayAt06AMWindSpeed").innerText = Math.round(temp.hour[6].wind_kph) + ` km/h`
                    document.getElementById("todayAt09AMWindSpeed").innerText = Math.round(temp.hour[9].wind_kph) + ` km/h`
                    document.getElementById("todayAt12PMWindSpeed").innerText = Math.round(temp.hour[12].wind_kph) + ` km/h`
                    document.getElementById("todayAt03PMWindSpeed").innerText = Math.round(temp.hour[15].wind_kph) + ` km/h`
                    document.getElementById("todayAt06PMWindSpeed").innerText = Math.round(temp.hour[18].wind_kph) + ` km/h`
                    document.getElementById("todayAt09PMWindSpeed").innerText = Math.round(temp.hour[21].wind_kph) + ` km/h`
                }
                generateForecast();

                if (forecastWeatherData.alerts.alert.length > 0) {
                    generateAlerts();
                }
            })
    } catch (error) {
        console.error('Error in callForecastWeatherAPI:', error);
    }
}

async function callHistoryAPI(currentLocation, pastDate) {
    try {
        await fetch(historyWeatherAPIBaseURL + apiKey + `&q=${currentLocation}&dt=${pastDate}`)
            .then(res => {
                if (!res.ok) {
                    handleAPIErrors(res);
                    throw new Error('API request failed');
                }
                return res.json();
            })
            .then(data => {
                historyWeatherData = data;

                historyWeatherDataCelciusArray.push(Math.round(historyWeatherData.forecast.forecastday[0].day.avgtemp_c))
                historyWeatherDataFahrenheitArray.push(Math.round(historyWeatherData.forecast.forecastday[0].day.avgtemp_f))

                generateHistory();
            })
    } catch (error) {
        console.error('Error in callHistoryAPI', error);
    }
}

async function callHistoryAPIHandler(currentLocation) {
    for (let index = historyDaysRequired; index > 0; index--) {
        const pastDate = new Date(today);
        pastDate.setDate(today.getDate() - index);
        const pastDateString = pastDate.toISOString().split('T')[0];
        await callHistoryAPI(currentLocation, pastDateString)
    }
}

// =================================================================
// ===================LANDING ON THE ERROR PAGE=====================
// =================================================================

function goToErrorPage(errorDescription) {
    sessionStorage.setItem("errorMessage", errorDescription);
    window.location.href = 'error.html';
}

function errorMessage() {
    if (sessionStorage.getItem('errorMessage')) {
        document.getElementById("errorMessage").innerText = sessionStorage.getItem('errorMessage');
    }
}

// =================================================================
// =========================HANDLE ERRORS===========================
// =================================================================

function handleAPIErrors(res) {
    return res.json().then(errorObject => {
        switch (errorObject.error.code) {
            case 1006:
                const toastLiveExample = document.getElementById('liveToast')
                document.getElementById('toastError').innerText = errorObject.error.message;

                const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample)
                toastBootstrap.show()
                break;
            default:
                goToErrorPage(errorObject.error.message)
                break;
        }
    });
}

// =================================================================
// =======================MEASURE AIR QUALITY=======================
// =================================================================

function measureAirQuality(index) {
    const airQualityIndicator = document.getElementById("airQualityIndicator");

    let bgColor;
    let txtColor;
    let txtTitle;

    switch (index) {
        case 1:
            bgColor = "lime"
            txtColor = "black"
            txtTitle = "Good"
            break;

        case 2:
            bgColor = "yellow"
            txtColor = "black"
            txtTitle = "Moderate"
            break;

        case 3:
            bgColor = "orange"
            txtColor = "black"
            txtTitle = "Unhealthy For Sensitive Groups"
            break;

        case 4:
            bgColor = "red"
            txtColor = "white"
            txtTitle = "Unhealthy"
            break;

        case 5:
            bgColor = "purple"
            txtColor = "white"
            txtTitle = "Very Unhealthy"
            break;

        case 6:
            bgColor = "maroon"
            txtColor = "white"
            txtTitle = "Hazardous"
            break;
    }
    let temp = `<span
                    class="mx-3 py-1 px-2 rounded-4"
                    style="background: ${bgColor}; color: ${txtColor};"
                    >${txtTitle}</span
                  >`
    airQualityIndicator.innerHTML = temp;
}

// =================================================================
// ========================GENERATE FORECAST========================
// =================================================================

function generateForecast() {
    let forecastWeather = document.getElementById("forecastWeather");
    let forecastDates = document.getElementById("forecastDates");

    for (let index = 0; index < forecastWeatherData.forecast.forecastday.length; index++) {
        let temp1 = `<div
                        class="d-flex mt-2 align-items-center justify-content-center"
                      >
                        <img src="${getWeatherImgIcon(forecastWeatherData.forecast.forecastday[index].day.condition.code, null)}" width="43px" alt="" />
                        <div class="fw-bolder ms-3" style="font-size: medium">
                          <span id="forecastDay${index}TempValue">${generateForecastTemp(index)}&deg;</span><span id="forecastDay${index}TempUnit">C</span>
                        </div>
                      </div>`
        forecastWeather.innerHTML += temp1;

        let temp2 = `<div class="fw-bolder mt-2 d-flex justify-content-center align-items-center" id="forecastDate" style="height: 43px;">${forecastWeatherData.forecast.forecastday[index].date}</div>`
        forecastDates.innerHTML += temp2;
    }
}

function generateForecastTemp(index) {
    return Math.round(forecastWeatherData.forecast.forecastday[index].day.avgtemp_c)
}

// =================================================================
// ========================GENERATE HISTORY=========================
// =================================================================

function generateHistory() {
    let historyWeather = document.getElementById("historyWeather");
    let historyDates = document.getElementById("historyDates");

    let temp1 = `<div
                        class="d-flex mt-2 align-items-center justify-content-center"
                      >
                        <img src="${getWeatherImgIcon(historyWeatherData.forecast.forecastday[0].day.condition.code, null)}" width="43px" alt="" />
                        <div class="fw-bolder ms-3" style="font-size: medium">
                          <span id="historyTempValue">${generateHistoryTemp()}&deg;</span><span id="historyTempUnit">C</span>
                        </div>
                      </div>`
    historyWeather.innerHTML += temp1;

    let temp2 = `<div class="fw-bolder mt-2 d-flex justify-content-center align-items-center" id="forecastDate" style="height: 43px;">${historyWeatherData.forecast.forecastday[0].date}</div>`
    historyDates.innerHTML += temp2;

}

function generateHistoryTemp() {
    return Math.round(historyWeatherData.forecast.forecastday[0].day.avgtemp_c)
}

// =================================================================
// ========================GENERATE ALERTS==========================
// =================================================================

function generateAlerts() {
    let weatherAlertHolder = document.getElementById("weatherAlertHolder");
    const weatherAlert = `<div class="mx-3 my-3 fw-bolder" id="titles">
              <strong>Weather Alerts</strong>
            </div>
            <div class="card-body rounded-4 p-4 bg-white">
              <ul class="list-unstyled text-danger fixed-indent" id="weatherAlertList">
              </ul>
            </div>`
    weatherAlertHolder.innerHTML = weatherAlert;

    let weatherAlertList = document.getElementById("weatherAlertList")
    for (let index = 0; index < forecastWeatherData.alerts.alert.length; index++) {
        let weatherAlertListItem = `<div class="d-flex align-items-start mb-3">
                  <i class="bi bi-exclamation-circle-fill h2 pe-2"></i>
                  <div>
                    <span class="fw-bolder">${forecastWeatherData.alerts.alert[index].headline} - </span>${forecastWeatherData.alerts.alert[index].desc}
                  </div>
                </div>`
        weatherAlertList.appendChild(weatherAlertListItem);
    }
}

// =================================================================
// ========================LOGICS & OTHER===========================
// =================================================================

//////////////////////// ================HIDE LOADING==================

function hideLoading() {
    document.getElementById("main").style.display = "block";
    setTimeout(() => {
        document.getElementById("loading").style.visibility = "hidden";
        document.getElementById("currentWeatherCard").style.visibility = "visible";
    }, 500);
}

//////////////////////// ================TEMPERATURE TOGGLE EXECUTION==================

function tempToggled() {
    isTempToggled = !isTempToggled;

    if (isTempToggled) {
        // CURRENT API
        document.getElementById("currentTemperatureValue").innerText = Math.round(currentWeatherData.current.temp_f) + `\u00B0`
        document.getElementById("temperatureUnit").innerText = "F";

        document.getElementById("currentFeelsLikeValue").innerText = Math.round(currentWeatherData.current.feelslike_f) + `\u00B0`
        document.getElementById("currentFeelsLikeValueUnit").innerText = "F";

        // FORECAST API
        document.getElementById("todayAt12AMTempValue").innerText = Math.round(forecastWeatherData.forecast.forecastday[0].hour[0].temp_f) + `\u00B0`
        document.getElementById("todayAt03AMTempValue").innerText = Math.round(forecastWeatherData.forecast.forecastday[0].hour[3].temp_f) + `\u00B0`
        document.getElementById("todayAt06AMTempValue").innerText = Math.round(forecastWeatherData.forecast.forecastday[0].hour[6].temp_f) + `\u00B0`
        document.getElementById("todayAt09AMTempValue").innerText = Math.round(forecastWeatherData.forecast.forecastday[0].hour[9].temp_f) + `\u00B0`
        document.getElementById("todayAt12PMTempValue").innerText = Math.round(forecastWeatherData.forecast.forecastday[0].hour[12].temp_f) + `\u00B0`
        document.getElementById("todayAt03PMTempValue").innerText = Math.round(forecastWeatherData.forecast.forecastday[0].hour[15].temp_f) + `\u00B0`
        document.getElementById("todayAt06PMTempValue").innerText = Math.round(forecastWeatherData.forecast.forecastday[0].hour[18].temp_f) + `\u00B0`
        document.getElementById("todayAt09PMTempValue").innerText = Math.round(forecastWeatherData.forecast.forecastday[0].hour[21].temp_f) + `\u00B0`

        for (let index = 0; index < forecastDaysRequired; index++) {
            document.getElementById(`forecastDay${index}TempValue`).innerText = Math.round(forecastWeatherData.forecast.forecastday[index].day.avgtemp_f) + `\u00B0`
            document.getElementById(`forecastDay${index}TempUnit`).innerText = "F"
        }

        document.getElementById("todayAt12AMTempUnit").innerText = "F";
        document.getElementById("todayAt03AMTempUnit").innerText = "F";
        document.getElementById("todayAt06AMTempUnit").innerText = "F";
        document.getElementById("todayAt09AMTempUnit").innerText = "F";
        document.getElementById("todayAt12PMTempUnit").innerText = "F";
        document.getElementById("todayAt03PMTempUnit").innerText = "F";
        document.getElementById("todayAt06PMTempUnit").innerText = "F";
        document.getElementById("todayAt09PMTempUnit").innerText = "F";

        // HISTORY API
        {
            let index = 0;
            document.querySelectorAll('#historyTempValue').forEach((child) => {
                child.innerText = `${historyWeatherDataFahrenheitArray[index]}\u00B0`
            })
            document.querySelectorAll('#historyTempUnit').forEach((child) => {
                child.innerText = "F"
            })
        }

    } else {
        // CURRENT API
        document.getElementById("currentTemperatureValue").innerText = Math.round(currentWeatherData.current.temp_c) + `\u00B0`
        document.getElementById("temperatureUnit").innerText = "C";

        document.getElementById("currentFeelsLikeValue").innerText = Math.round(currentWeatherData.current.feelslike_c) + `\u00B0`
        document.getElementById("currentFeelsLikeValueUnit").innerText = "C";

        // FORECAST API
        document.getElementById("todayAt12AMTempValue").innerText = Math.round(forecastWeatherData.forecast.forecastday[0].hour[0].temp_c) + `\u00B0`
        document.getElementById("todayAt03AMTempValue").innerText = Math.round(forecastWeatherData.forecast.forecastday[0].hour[3].temp_c) + `\u00B0`
        document.getElementById("todayAt06AMTempValue").innerText = Math.round(forecastWeatherData.forecast.forecastday[0].hour[6].temp_c) + `\u00B0`
        document.getElementById("todayAt09AMTempValue").innerText = Math.round(forecastWeatherData.forecast.forecastday[0].hour[9].temp_c) + `\u00B0`
        document.getElementById("todayAt12PMTempValue").innerText = Math.round(forecastWeatherData.forecast.forecastday[0].hour[12].temp_c) + `\u00B0`
        document.getElementById("todayAt03PMTempValue").innerText = Math.round(forecastWeatherData.forecast.forecastday[0].hour[15].temp_c) + `\u00B0`
        document.getElementById("todayAt06PMTempValue").innerText = Math.round(forecastWeatherData.forecast.forecastday[0].hour[18].temp_c) + `\u00B0`
        document.getElementById("todayAt09PMTempValue").innerText = Math.round(forecastWeatherData.forecast.forecastday[0].hour[21].temp_c) + `\u00B0`

        for (let index = 0; index < forecastDaysRequired; index++) {
            document.getElementById(`forecastDay${index}TempValue`).innerText = Math.round(forecastWeatherData.forecast.forecastday[index].day.avgtemp_c) + `\u00B0`
            document.getElementById(`forecastDay${index}TempUnit`).innerText = "C"
        }

        document.getElementById("todayAt12AMTempUnit").innerText = "C";
        document.getElementById("todayAt03AMTempUnit").innerText = "C";
        document.getElementById("todayAt06AMTempUnit").innerText = "C";
        document.getElementById("todayAt09AMTempUnit").innerText = "C";
        document.getElementById("todayAt12PMTempUnit").innerText = "C";
        document.getElementById("todayAt03PMTempUnit").innerText = "C";
        document.getElementById("todayAt06PMTempUnit").innerText = "C";
        document.getElementById("todayAt09PMTempUnit").innerText = "C";

        // HISTORY API
        {
            let index = 0;
            document.querySelectorAll('#historyTempValue').forEach((child) => {
                child.innerText = `${historyWeatherDataCelciusArray[index]}\u00B0`
            })
            document.querySelectorAll('#historyTempUnit').forEach((child) => {
                child.innerText = "C"
            })
        }
    }
}

//////////////////////// ================GET WEATHER ICON==================

function getWeatherImgIcon(code, isDay) {
    switch (code) {
        case 1000:
            if (isDay == null) {
                return "src/sunny.png";
            } else {
                return isDay != 0 ? "src/sunny.png" : "src/clear.png";
            }

        case 1003:
            if (isDay == null) {
                return "src/sunny cloudy.png";
            } else {
                return isDay != 0 ? "src/sunny cloudy.png" : "src/night cloudy.png";
            }

        case 1006:
        case 1009:
            return "src/cloudy.png";

        case 1030:
        case 1135:
        case 1147:
            return "src/fog.png";

        case 1180:
        case 1183:
        case 1189:
        case 1195:
        case 1198:
        case 1201:
        case 1240:
        case 1243:
        case 1246:
            if (isDay == null) {
                return "src/rain sunny.png";
            } else {
                return isDay != 0 ? "src/rain sunny.png" : "src/rain night.png";
            }

        case 1066:
        case 1069:
        case 1114:
        case 1117:
        case 1204:
        case 1207:
        case 1210:
        case 1213:
        case 1216:
        case 1219:
        case 1222:
        case 1225:
        case 1237:
        case 1249:
        case 1252:
        case 1255:
        case 1258:
        case 1261:
        case 1264:
            return "src/snow.png";

        case 1072:
        case 1150:
        case 1153:
        case 1168:
        case 1171:
            return "src/drizzle.png";

        case 1087:
        case 1273:
        case 1276:
        case 1279:
        case 1282:
            return "src/thunder.png";

        case 1063:
        case 1186:
        case 1192:
            return "src/heavy cloud.png";
    }
}

//////////////////////// ================GET WEATHER HERO==================

function getWeatherImgHero(code) {
    switch (code) {
        case 1000:
        case 1003:
        case 1006:
        case 1009:
            if (currentWeatherData.current.is_day) {
                document.getElementById("temperatureUnitToggler").style.color = `black`;
                return "src/sunnyHero.png";
            } else {
                document.getElementById("temperatureUnitToggler").style.color = `white`;
                return "src/nightHero.png";
            }

        case 1030:
        case 1135:
        case 1147:
            document.getElementById("temperatureUnitToggler").style.color = `black`;
            return "src/fogHero.png";

        case 1063:
        case 1072:
        case 1150:
        case 1153:
        case 1168:
        case 1171:
        case 1180:
        case 1183:
        case 1186:
        case 1189:
        case 1192:
        case 1195:
        case 1198:
        case 1201:
        case 1240:
        case 1243:
        case 1246:
            document.getElementById("temperatureUnitToggler").style.color = `black`;
            return "src/rainHero.png";

        case 1066:
        case 1069:
        case 1114:
        case 1117:
        case 1204:
        case 1207:
        case 1210:
        case 1213:
        case 1216:
        case 1219:
        case 1222:
        case 1225:
        case 1237:
        case 1249:
        case 1252:
        case 1255:
        case 1258:
        case 1261:
        case 1264:
            document.getElementById("temperatureUnitToggler").style.color = `black`;
            return "src/snowyHero.png";

        case 1087:
        case 1273:
        case 1276:
        case 1279:
        case 1282:
            document.getElementById("temperatureUnitToggler").style.color = `white`;
            return "src/thunderHero.png";
    }
}

//////////////////////// ================BTN SUBMIT CLICKED==================

function btnSubmitClicked() {
    let email = document.getElementById("floatingEmail").value;
    let msg = document.getElementById("floatingMessage").value;

    function validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    if (validateEmail(email) && msg) {
        const toastLiveExample = document.getElementById('successToast')
        const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample)
        toastBootstrap.show()
    } else {
        const toastLiveExample = document.getElementById('failureToast')
        const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample)
        toastBootstrap.show()
    }

    document.getElementById("floatingEmail").value = "";
    document.getElementById("floatingMessage").value = "";
}



