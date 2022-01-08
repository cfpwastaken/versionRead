import fetch from "node-fetch";
import Version from "./Version.js";
import fs from "fs";
import * as svglib from "svglib";

const URL = "https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-starter/";

const regex = /(\d+).(\d+).(\d+).*(\d{4}-\d{2}-\d{2})/;

async function getVersions() {
    const result = await fetch(URL).then(res => res.text());
    return result.split("\n")
        .map(line => line.match(regex))
        .filter(match => match != null)
        .map(match => new Version(match[1], match[2], match[3], new Date(match[4])));
}

function getDates(startDate, endDate) {
    const dates = []
    let currentDate = startDate
    const addDays = function (days) {
        const date = new Date(this.valueOf())
        date.setDate(date.getDate() + days)
        return date
    }
    while (currentDate <= endDate) {
        dates.push(currentDate)
        currentDate = addDays.call(currentDate, 1)
    }
    return dates
}

const colors = ["red", "green", "blue", "orange", "yellow", "purple", "pink", "brown", "gray", "lime", "cyan", "magenta", "black"];
let currentColor = 0;

const FONT = process.argv[2] || "Arial";
const X_OFFSET = 10;

function toSVG(versions) {
    const lastDate = versions[versions.length - 1].date;
    const firstDate = versions[0].date;
    const dates = getDates(firstDate, lastDate);
    const SVG_WIDTH = dates.length * 10 / 30 + 10;
    const svg = new svglib.Svg(SVG_WIDTH + 10, 100);
    let x = 10;
    let verBeginX = 0;
    let verY = 50;
    let verLineSize = 0;
    let lastMajor = 1;
    let lastMinor = -1;
    let shouldDrawDate = 1;
    let lastYear = -1;
    svg.add(new svglib.Line(10, 70, SVG_WIDTH, 70, "gray"));
    svg.add(new svglib.Circle(x, 70, 3, "white", "gray"));
    x += X_OFFSET;
    for(let i = 0; i < dates.length; i += 30) { // muss eine fori schleife sein wegen i += 30
        const date = dates[i];
        //svg.add(new svglib.Circle(x, verY, 3, "gray", "white"));
        svg.add(new svglib.Circle(x, 70, 3, "white", "gray"));
        // add date text at the bottom of the circle
        if(date.getFullYear() != lastYear) {
            if(i == 0) {
                svg.add(new svglib.Text(x - 15, 90 + 7, date.getFullYear(), FONT));
                svg.add(new svglib.Line(x - X_OFFSET, 80, x - X_OFFSET, 73, "gray"));
            } else {
                svg.add(new svglib.Text(x - 16, 90 + 7, date.getFullYear(), FONT));
                svg.add(new svglib.Line(x, 80, x, 73, "gray"));
            }
            lastYear = date.getFullYear();
            // draw a line to the circle
        }
        x += X_OFFSET;
        verLineSize += 7;
    }
    for (const version of versions) {
        // only if major or minor changed
        if(version.major != lastMajor || version.minor != lastMinor) {
            // find the date index of the version and draw a circle
            const dateIndex = dates.findIndex(date => date.getDay() == version.date.getDay() && date.getMonth() == version.date.getMonth() && date.getFullYear() == version.date.getFullYear());
            if (dateIndex == -1) { console.error("NO DATE INDEX"); continue; }
            const x = dateIndex * X_OFFSET / 30 + 10 + 10;
            svg.add(new svglib.Circle(x, verY, 5, colors[currentColor], "white"));
            // draw the version number
            svg.add(new svglib.Text(x - X_OFFSET, verY - 15, version.major + "." + version.minor, FONT));
            // if major version changed, change the verY position by 20 and change the currentColor by 1
            if(version.major != lastMajor) {
                verY -= 20;
                currentColor++;
            }
            lastMajor= version.major;
            lastMinor = version.minor;
        } else {
            console.log("SAME VERSION");
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