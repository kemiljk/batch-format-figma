var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
figma.showUI(__html__, { width: 300, height: 348 });
const nodeTypes = ["RECTANGLE", "ELLIPSE", "POLYGON", "STAR"];
const { selection } = figma.currentPage;
function clone(val) {
    return JSON.parse(JSON.stringify(val));
}
figma.ui.onmessage = (msg) => {
    if (msg.type === "set-to-fill") {
        const images = figma.currentPage.selection;
        function setToFill() {
            return __awaiter(this, void 0, void 0, function* () {
                figma.root.children.flatMap((pageNode) => pageNode.selection.forEach((node) => __awaiter(this, void 0, void 0, function* () {
                    if (nodeTypes.includes(node.type)) {
                        node.fills = node.fills.map((p) => p.type === "IMAGE" ? Object.assign(Object.assign({}, p), { scaleMode: "FILL" }) : p);
                        let widthResult = msg.widthCount / node.width;
                        let heightResult = msg.heightCount / node.height;
                        if (msg.heightCount === 0) {
                            node.rescale(widthResult);
                            node.resize(Math.round(node.width), Math.round(node.height));
                        }
                        else if (msg.widthCount === 0) {
                            node.rescale(heightResult);
                            node.resize(Math.round(node.width), Math.round(node.height));
                        }
                        else {
                            node.resize(msg.widthCount, msg.heightCount);
                        }
                    }
                })));
            });
        }
        setToFill();
        figma.notify(`Set ${images.length} images to FILL`);
        if (msg.checkboxOn === true) {
            figma.closePlugin();
        }
    }
    if (msg.type === "set-to-fit") {
        const images = figma.currentPage.selection;
        function setToFit() {
            return __awaiter(this, void 0, void 0, function* () {
                figma.root.children.flatMap((pageNode) => pageNode.selection.forEach((node) => __awaiter(this, void 0, void 0, function* () {
                    if (nodeTypes.includes(node.type)) {
                        node.fills = node.fills.map((p) => p.type === "IMAGE" ? Object.assign(Object.assign({}, p), { scaleMode: "FIT" }) : p);
                        let widthResult = msg.widthCount / node.width;
                        let heightResult = msg.heightCount / node.height;
                        if (msg.heightCount === 0) {
                            node.rescale(widthResult);
                            node.resize(Math.round(node.width), Math.round(node.height));
                        }
                        else if (msg.widthCount === 0) {
                            node.rescale(heightResult);
                            node.resize(Math.round(node.width), Math.round(node.height));
                        }
                        else {
                            node.resize(msg.widthCount, msg.heightCount);
                        }
                    }
                })));
            });
        }
        setToFit();
        figma.notify(`Set ${images.length} images to FIT`);
        if (msg.checkboxOn === true) {
            figma.closePlugin();
        }
    }
    if (msg.type === "set-to-crop") {
        const images = figma.currentPage.selection;
        function setToCrop() {
            return __awaiter(this, void 0, void 0, function* () {
                figma.root.children.flatMap((pageNode) => pageNode.selection.forEach((node) => __awaiter(this, void 0, void 0, function* () {
                    if (nodeTypes.includes(node.type)) {
                        node.fills = node.fills.map((p) => p.type === "IMAGE" ? Object.assign(Object.assign({}, p), { scaleMode: "CROP" }) : p);
                        let widthResult = msg.widthCount / node.width;
                        let heightResult = msg.heightCount / node.height;
                        if (msg.heightCount === 0) {
                            node.rescale(widthResult);
                            node.resize(Math.round(node.width), Math.round(node.height));
                        }
                        else if (msg.widthCount === 0) {
                            node.rescale(heightResult);
                            node.resize(Math.round(node.width), Math.round(node.height));
                        }
                        else {
                            node.resize(msg.widthCount, msg.heightCount);
                        }
                    }
                })));
            });
        }
        setToCrop();
        figma.notify(`Set ${images.length} images to CROP`);
        if (msg.checkboxOn === true) {
            figma.closePlugin();
        }
    }
    if (msg.type === "set-to-tile") {
        const images = figma.currentPage.selection;
        function setToTile() {
            return __awaiter(this, void 0, void 0, function* () {
                figma.root.children.flatMap((pageNode) => pageNode.selection.forEach((node) => __awaiter(this, void 0, void 0, function* () {
                    if (nodeTypes.includes(node.type)) {
                        node.fills = node.fills.map((p) => p.type === "IMAGE" ? Object.assign(Object.assign({}, p), { scaleMode: "TILE" }) : p);
                        let widthResult = msg.widthCount / node.width;
                        let heightResult = msg.heightCount / node.height;
                        if (msg.heightCount === 0) {
                            node.rescale(widthResult);
                            node.resize(Math.round(node.width), Math.round(node.height));
                        }
                        else if (msg.widthCount === 0) {
                            node.rescale(heightResult);
                            node.resize(Math.round(node.width), Math.round(node.height));
                        }
                        else {
                            node.resize(msg.widthCount, msg.heightCount);
                        }
                    }
                })));
            });
        }
        setToTile();
        figma.notify(`Set ${images.length} images to TILE`);
        if (msg.checkboxOn === true) {
            figma.closePlugin();
        }
    }
    if (msg.type === "remove-fill-layer") {
        function removeFillLayer() {
            return __awaiter(this, void 0, void 0, function* () {
                figma.root.children.flatMap((pageNode) => pageNode.selection.forEach((node) => __awaiter(this, void 0, void 0, function* () {
                    const fills = clone(node.fills);
                    if (fills.length >= 2) {
                        if (node.type !== "IMAGE") {
                            fills.splice(0, 1);
                            node.fills = fills;
                        }
                    }
                })));
            });
        }
        removeFillLayer();
        if (msg.checkboxOn === true) {
            figma.closePlugin();
        }
    }
    if (msg.type === "set-blend-mode") {
        function setBlendMode() {
            return __awaiter(this, void 0, void 0, function* () {
                figma.root.children.flatMap((pageNode) => pageNode.selection.forEach((node) => __awaiter(this, void 0, void 0, function* () {
                    if (nodeTypes.includes(node.type)) {
                        node.fills = node.fills.map((p) => p.type === "IMAGE" ? Object.assign(Object.assign({}, p), { blendMode: msg.blendMode }) : p);
                    }
                })));
            });
        }
        setBlendMode();
        if (msg.checkboxOn === true) {
            figma.closePlugin();
        }
    }
};
