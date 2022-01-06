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

function monthsToSVG(dates, year) {
    let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><line x1="10" x2="200" y1="90" y2="90" stroke="gray" />';
    let x = 10;
    let months = [];
    for (const date of dates) {
        if(date.getFullYear() == year) months.push(date.getMonth());
        if(date.getFullYear() == year + 1) months.push(date.getMonth() + 12);
    }
    console.log(months);
    for (let i = 0; i < 12 * 2; i++) {
        svg += `<circle cx="${x}" cy="90" r="3"${months.includes(i) ? " stroke='lime'" : " stroke='gray' fill='white'"} />\n`;
        x += 7;
    }
    svg += '</svg>';
    return svg;
}

function toSVG(versions) {
    const svg = new svglib.Svg(versions.length * 7 + 10, 100);
    svg.add(new svglib.Line(10, 70, versions.length * 7 + 10, 70, "gray"));
    // centered text at the top saying "Spring Boot"
    svg.add(new svglib.Text(10, 90, "Spring Boot Version History, scraped at " + new Date().toLocaleString()));
    // for every version
    let x = 10;
    let verBeginX = 0;
    let verY = 70;
    let verLineSize = 0;
    let lastMajor = -1;
    let lastMinor = -1;
    for (let i = 0; i < versions.length; i++) {
        const version = versions[i];
        // add a circle, color it green if it's a major version
        svg.add(new svglib.Circle(x, 70, 3, version.major > lastMajor ? "lime" : version.minor > lastMinor ? "orange" : "gray", version.major ? "white" : "gray"));
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
    }
    x -= 7;
    verLineSize -= 7;
    svg.add(new svglib.Line(verBeginX, verY, verBeginX + verLineSize, verY, "gray"));
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