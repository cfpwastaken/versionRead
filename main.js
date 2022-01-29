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

function drawSVGdates(datesInBetween, svg, x, lastYear) {
    for (let i = 0; i < datesInBetween.length; i += 31) {
        const date = datesInBetween[i];
        svg.add(new svglib.Circle(x, 70, 3, "white", SHAPE_COLOR));
        if (date.getFullYear() != lastYear) {
            if (i == 0) {
                svg.add(new svglib.Text(x - 15, 90 + 7, date.getFullYear(), FONT));
                svg.add(new svglib.Line(x - X_STEP, 80, x - X_STEP, 73, SHAPE_COLOR));
            } else {
                svg.add(new svglib.Text(x - 16, 90 + 7, date.getFullYear(), FONT));
                svg.add(new svglib.Line(x, 80, x, 73, "gray"));
            }
            lastYear = date.getFullYear();
        }
        x += X_STEP;
    }
    // svg.add(new svglib.Line(x, 80, x, 73, "gray"));
    // svg.add(new svglib.Text(x - 16, 90 + 7, new Date().getFullYear(), FONT));
    for(let i = 0; i < 3; i++) {
        svg.add(new svglib.Circle(x, 70, 3, "white", SHAPE_COLOR));
        x += X_STEP;
    }
}

function drawSVGVersions(x, versions, firstDate, lastMajor, lastMinor, verY, svg, TOTAL_SVG_WIDTH) {
    let startX = x + 5;
    let draw = [];
    const majorChanged = (x) => {
        verY -= 20;
        // svg.add(new svglib.Rectangle(startX + 4, verY + 10, x - 12, 20, COLORS[currentColor % COLORS.length]));
        // svg.add(new svglib.Circle(startX + 3, verY + 20, 10, COLORS[currentColor]));
        // svg.add(new svglib.Circle(x + 6, verY + 20, 10, COLORS[currentColor]));
        // make a rounded line that is very thick
        svg.add(new svglib.RoundedLine(startX + 4, verY + 20, x + 25, verY + 20, COLORS[currentColor % COLORS.length]));
        startX = x;
        currentColor++;
        for(const add of draw) {
            svg.add(add);
        }
        draw = [];
    }
    let xOfLastVersion = 0;
    for (const version of versions) {
        const months = (version.date.getMonth() - firstDate.getMonth()) + (version.date.getFullYear() - firstDate.getFullYear()) * 12;
        const x = months * X_STEP + 15;
        if (version.major != lastMajor) {
            majorChanged(xOfLastVersion);
            startX = x;
        }
        xOfLastVersion = x;
        if(version.minor != lastMinor) {
            draw.push(new svglib.Circle(x + 5, verY, 5, "white", SHAPE_COLOR));
            svg.add(new svglib.Text(x - X_STEP + 5, verY - 15, version.major + "." + version.minor, FONT));
        } else {
            draw.push(new svglib.Circle(x + 5, verY, 2, "white", SHAPE_COLOR));
        }
        lastMajor = version.major;
        lastMinor = version.minor;
    }
    majorChanged(TOTAL_SVG_WIDTH)
}

function toSVG(versions) {
    const firstDate = versions[0].date;
    const datesInBetween = between(firstDate, new Date());
    const TOTAL_SVG_WIDTH = datesInBetween.length * X_STEP / 30 + 10;
    const svg = new svglib.Svg(TOTAL_SVG_WIDTH - 7 + X_STEP + 10, SVG_HEIGHT);
    let verY = 50;
    let lastMajor = 1;
    let lastMinor = -1;
    let lastYear = -1;
    svg.add(new svglib.Line(10, 70, TOTAL_SVG_WIDTH + 10, 70, SHAPE_COLOR));

    let x = X_STEP;
    svg.add(new svglib.Circle(x, 70, 3, "white", SHAPE_COLOR));

    x += X_STEP;
    drawSVGdates(datesInBetween, svg, x, lastYear);
    x = X_STEP;
    drawSVGVersions(x, versions, firstDate, lastMajor, lastMinor, verY, svg, TOTAL_SVG_WIDTH);
    return svg.get();
}

async function run() {
    const versions = await getVersions();
    console.log(versions);
    fs.writeFileSync("result.svg", toSVG(versions));
}

run();
