const { app } = require('electron');
const { TypieRowItem } = require('typie-sdk');
const is = require('electron-is');
const Path = require('path');
const fs = require('fs');
// const chokidar = require("chokidar");


let chromeDir;
if (is.windows()) {
    chromeDir = Path.join(app.getPath('home'), '/AppData/Local/Google/Chrome/User Data/Default')
} else if (is.macOS()) {
    chromeDir = Path.join(app.getPath('home'), '/Library/Application Support/Google/Chrome/Default')
}

class BookmarksWalker {

    constructor(pkg) {
        this.pkg = pkg;
        this.bookPath = Path.join(chromeDir, "Bookmarks");
        this.bookmarksArray = [];
        this.isWatching = false;
    }

    walk() {
        this.bookmarksArray = [];
        return new Promise((resolve, reject) => {
            this.getBookmarksData()
                .then(data => {
                    Object.keys(data.roots).forEach((key) => {
                        this.walkBookmarksFolder(data.roots[key]);
                    });
                    resolve(this.bookmarksArray);
                })
                .catch(e => {
                    console.error("could not get bookmarks data", e);
                    reject(this.bookmarksArray);
                });
        });
    }

    walkBookmarksFolder(folder) {
        if (folder.children) {
            for (let i in folder.children) {
                let child = folder.children[i];
                let parentName = folder.name;
                if (child.children) {
                    this.walkBookmarksFolder(child);
                } else {
                    this.addBookmark(child, parentName)
                }
            }
        }
    }

    addBookmark(child, parentName) {
        let lastUsed = 0;
        if (child.meta_info && child.meta_info.last_visited_desktop) {
            lastUsed = parseInt(child.meta_info.last_visited_desktop / 1000 / 10000);
        }
        this.bookmarksArray.push(
            (new TypieRowItem(child.name + ' - Bookmarks'))
                .setPackage('Bookmarks')
                .setDB('global')
                .setDescription(parentName + ': ' + child.url)
                .setPath(child.url)
                .setUnixtime(lastUsed)
                .setIcon(defaultUrlIco)
        );
    }

    getBookmarksData() {
        return new Promise((resolve, reject) => {
            fs.readFile(this.bookPath, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(JSON.parse(data));
                }
            });
        });
    }

    // watchFile() {
    //     if (!this.isWatching) {
    //         console.log("start watching for bookmarks changes");
    //         const watcher = chokidar.watch(this.bookPath, {persistent: true});
    //         watcher.on("change", (path, stats) => {
    //             if (stats) {
    //                 this.walk();
    //             }
    //         });
    //         this.isWatching = true;
    //     }
    // }
    //
    // stopWatch() {
    //     chokidar.unwatch(this.bookPath);
    // }


}
module.exports = BookmarksWalker;

const defaultUrlIco = 'data:image/png;base64,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';