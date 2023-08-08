export class Style {
    #body = null;

    constructor(bodyElement) {
		this.#body = bodyElement;
    }

    renderBackground() {
        let cssText = '';
        for (let x = 0; x < 5; x += 0.4) {
            let xPos = Math.round(Math.sin(x) * 100 + 300);
            let yPos = Math.round(x * 300 + 300);
            let stop1 = Math.round(x * 100 + 500);
            let stop2 = Math.round(stop1 + 10);
            cssText += `radial-gradient(circle at top ${yPos}px left ${xPos}px, rgba(128,128,255,0.05) ${stop1}px, rgba(0,0,128,0.05) ${stop2}px),`;
        }
		cssText += ' linear-gradient(#00f, #f00)'; 

		let style = { backgroundImage: cssText };
		$(this.#body).css(style);
    }
}
