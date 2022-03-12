export default class Version { 
    major: number;
    minor: number;
    patch: number;
    date: Date;

    constructor(major: number, minor: number, patch: number, date: Date) {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
        this.date = date;
    }

    toString() {
        return this.major + "." + this.minor + "." + this.patch;
    }
}
