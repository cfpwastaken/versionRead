export default class Version {
    constructor(major, minor, patch, date) {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
        this.date = date;
    }
    toString() {
        return this.major + "." + this.minor + "." + this.patch;
    }
}
