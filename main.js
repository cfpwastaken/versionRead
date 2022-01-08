import fetch from "node-fetch";
import Version from "./Version.js";
import fs from "fs";
import * as svglib from "svglib";

const URL = "https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-starter/";
const VERBOSE = false;

const COLORS = ["firebrick", "forestgreen"];
const FONT = "Arial"
const X_STEP = 10;
const SVG_HEIGHT = 100;
const SHAPE_COLOR = "gray";

async function getVersions() {
    const result = await fetch(URL).then(res => res.text());
    return result.split("\n")
        .map(line => line.match(versionNumberRegex))
        .filter(match => match != null)
        .map(match => new Version(match[1], match[2], match[3], new Date(match[4])));
}

function between(startDate, endDate) {
    const dates = []
    let currentDate = startDate
    const addOneDay = function () {
        const date = new Date(this.valueOf())
        date.setDate(date.getDate() + 1)
        return date
    }
    while (currentDate <= endDate) {
        dates.push(currentDate)
        currentDate = addOneDay.call(currentDate)
    }
    return dates
}


let currentColor = 0;
const versionNumberRegex = /(\d+).(\d+).(\d+).*(\d{4}-\d{2}-\d{2})/;

function toSVG(versions) {
    const firstDate = versions[0].date;
    const lastDate = versions[versions.length - 1].date;
    const datesInBetween = between(firstDate, lastDate);
    const TOTAL_SVG_WIDTH = datesInBetween.length * X_STEP / 30 + 10;
    const svg = new svglib.Svg(TOTAL_SVG_WIDTH + X_STEP + 10, SVG_HEIGHT);
    let verY = 50;
    let lastMajor = 1;
    let lastMinor = -1;
    let lastYear = -1;
    svg.add(new svglib.Line(10, 70, TOTAL_SVG_WIDTH + 10, 70, SHAPE_COLOR));

    let x = X_STEP;
    svg.add(new svglib.Circle(x, 70, 3, "white", SHAPE_COLOR));

    x += X_STEP;
    for (let i = 0; i < datesInBetween.length; i += 30) {
        const date = datesInBetween[i];
        //svg.add(new svglib.Circle(x, verY, 3, "gray", "white"));
        svg.add(new svglib.Circle(x, 70, 3, "white", SHAPE_COLOR));
        // add date text at the bottom of the circle
        if (date.getFullYear() != lastYear) {
            if (i == 0) {
                svg.add(new svglib.Text(x - 15, 90 + 7, date.getFullYear(), FONT));
                svg.add(new svglib.Line(x - X_STEP, 80, x - X_STEP, 73, SHAPE_COLOR));
            } else {
                svg.add(new svglib.Text(x - 16, 90 + 7, date.getFullYear(), FONT));
                svg.add(new svglib.Line(x, 80, x, 73, "gray"));
            }
            lastYear = date.getFullYear();
            // draw a line to the circle
        }
        x += X_STEP;
    }
    for (const version of versions) {
        // only if major or minor changed
        if (version.major != lastMajor || version.minor != lastMinor) {
            // find the date index of the version and draw a circle
            const dateIndex = datesInBetween.findIndex(date => date.getDay() == version.date.getDay() && date.getMonth() == version.date.getMonth() && date.getFullYear() == version.date.getFullYear());
            if (dateIndex == -1) { if (VERBOSE) { console.error("NO DATE INDEX"); } continue; }
            const x = dateIndex * X_STEP / 30 + 15;
            // if major version changed, change the verY position by 20 and change the currentColor by 1
            if (version.major != lastMajor) {
                verY -= 20;
                currentColor++;
            }
            svg.add(new svglib.Circle(x, verY, 5, COLORS[currentColor], "white"));
            // draw the version number
            svg.add(new svglib.Text(x - X_STEP, verY - 15, version.major + "." + version.minor, FONT));
            lastMajor = version.major;
            lastMinor = version.minor;
        } else {
            if (VERBOSE) console.log("SAME VERSION");
        }
    }
    return svg.get();
}

async function run() {
    const versions = await getVersions();
    console.log(versions);
    fs.writeFileSync("result.svg", toSVG(versions));
}

run();
