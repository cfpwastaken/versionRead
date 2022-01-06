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

function toSVG(versions) {
    let x = 10;
    let verBeginX = 0;
    let verY = 70;
    let verLineSize = 0;
    let lastMajor = -1;
    let lastMinor = -1;
    const lastDate = versions[versions.length - 1].date;
    const firstDate = versions[0].date;
    const dates = getDates(firstDate, lastDate);
    const svg = new svglib.Svg(dates.length * 7 + 10, 100);
    svg.add(new svglib.Line(10, 70, dates.length * 7 + 10, 70, "gray"));
    svg.add(new svglib.Text(10, 90, "Spring Boot Version History, scraped at " + new Date().toLocaleString()));

    dates.forEach(date => {
        const version = versions.find(v => v.date.getDay() == date.getDay() && v.date.getMonth() == date.getMonth() && v.date.getFullYear() == date.getFullYear());
        if(version != null) {
            console.log("Found version " + version.toString() + " at " + date.toLocaleString());
            svg.add(new svglib.Circle(x, 70, 3, version.major > lastMajor ? "lime" : version.minor > lastMinor ? "orange" : "blue", version.major ? "white" : "gray"));
            
            if(version.major > lastMajor) {
                svg.add(new svglib.Line(verBeginX, verY, verBeginX + verLineSize, verY, "gray"));
                svg.add(new svglib.Text(verBeginX + verLineSize + 5, verY - 30, version.major.toString(), "gray"));
                verBeginX = x;
                verY -= 20;
            }
            lastMajor = version.major;
            lastMinor = version.minor;
            x += 7;
            verLineSize += 7;
        } else {
            console.log("No version found at " + date.toLocaleString());
            svg.add(new svglib.Circle(x, 70, 3, "gray", "white"));
            x += 7;
            verLineSize += 7;
        }
    });
    console.log(lastMajor);
    return svg.get();
}

async function run() {
    const versions = await getVersions();
    console.log(versions);
    // let dates = [];
    // let oldMinor = -1;
    // let oldMajor = -1;
    // for (let i = 0; i < versions.length; i++) {
    //     const version = versions[i];
    //     if(version.minor != oldMinor) dates.push(version.date);
    //     oldMinor = version.minor;
    // }
    // fs.writeFileSync("result.svg", monthsToSVG(dates, 2019));
    fs.writeFileSync("result.svg", toSVG(versions));
}

run();