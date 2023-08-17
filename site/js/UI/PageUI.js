import { Music } from "../Music/Music.js";
import { NoteGroup } from "../Music/NoteListBuilder.js";

const KeyOnColor = { text: '#000', key: '#fff', image: '' };
const KeyColors = {
	white: { text: '#000', key: '#fff', image: '' },
	black: { text: '#fff', key: '#000', image: '' }
};

export class PageUI {
    #opts = null;
    #elems = null;

    constructor(opts) {
        this.#opts = opts;
    	this.#elems = {
        	body: $('body'),
        	hPiano: $('#HPiano'),
        	vPiano: $('#VPiano')
    	};
    }

    set MasterVolume(val) {
		let volume = document.querySelector('#VolumeId');
        volume.value = val;
    }

    get VerticalKeys() {
        return document.querySelector('#VerticalKeys');
    }

    get HorizontalKeys() {
        return document.querySelector('#HorizontalKeys');
    }

    get VerticalKeys() {
        return document.querySelector('#VerticalKeys');
    }

    get MainForm() {
        return document.querySelector('#MainFormId');
    }

    log(msg) {
        let elem = document.querySelector('#ConsoleLog');
        elem.innerHTML += msg + "<br/>";
    }

    updateNoteTables(noteTable) {
        this.#elems.hPiano.html(this.#getHorizontalPiano(noteTable));
        this.#elems.vPiano.html(this.#getVerticalPiano(noteTable));
    }

    clearMidiLists() {
        let inputList = document.querySelector('#MidiInputDeviceId')
        if (inputList != null) {
            for (let opt in inputList.options) {
                inputList.options.remove(0);
            }
        }
    }

    addMidiInput(id, name, manufacturer, version) {
        let inputList = document.querySelector('#MidiInputDeviceId')
        let opt = document.createElement("option");
        opt.text = manufacturer + " / " + name + " (" + version + ")";
        opt.value = id;
        inputList.add(opt);
    }

    updateKeyStatus(midiNum, microDist, state = 'off') {
        let key1 = document.querySelector('#h_' + midiNum + '_' + microDist);
        let key2 = document.querySelector('#v_' + midiNum + '_' + microDist);
        let className = 'key-' + state;

        if (key1) {
            key1.classList.remove('key-off', 'key-on', 'key-error');
            key1.classList.add(className);
        }

        if (key2) {
            key2.classList.remove('key-off', 'key-on', 'key-error');
            key2.classList.add(className);
        }
    }

    toStatusMsg(msg, cssClass) {
        return '[<span class="' + cssClass + '">' + msg + '</span>]';
    }

    scrollTo(midiNum) {
		let id = '#v_' + midiNum + '_0';
		$('html, body').animate({
   	   	   scrollTop: $(id).offset().top
		}, 1000);
    }

    #getHorizontalPiano(noteTable) {
		let table = noteTable.getFlattenedTable();
        let html = '<div id="HorizontalKeys" class="piano">';

        for(const row of table) {
			let keyNote = row.KeyNote;
			let note = row.TIANote;

			if (keyNote.MicroDist != 0)
				continue;

            let midiNum = 'MicroDist="' + keyNote.MicroDist + '"';
            let microDist = 'MidiNum="' + keyNote.MidiNum + '"';
            let keyId = 'h_' + keyNote.MidiNum + '_' + keyNote.MicroDist;
            let classNames = keyNote.IsWhite ? 'white' : 'black';

			if (note != null && note.Cents <= this.#opts.TuningSensitivity) {
				if (this.#opts.TuningGradient) {
    				let colorClass = this.#keyGradientCSS(note.Cents, this.#opts.TuningSensitivity);
					classNames += ' paired-gradient ' + colorClass;
				} else {
					classNames += ' paired-flat';
				}
			}


            html += `<div class="key ${classNames}">`;
            if (keyNote.IsWhite) {
                html += `<span id="${keyId}" class="white" ${midiNum} ${microDist}>${keyNote.Key}<sub>${keyNote.Octave}</sub></span>`;
            } else {
                html += `<span id="${keyId}" class="black" ${midiNum} ${microDist}>${keyNote.KeyUp}<br/>${keyNote.KeyDown}</span>`;
            }
            html += '</div>';
        }
        html += '</div>';
        return html;
    }
/*
    #getHorizontalPiano(noteList) {
        let html = '<div id="HorizontalKeys" class="piano">';
        for(const note of noteList) {
			if (note.MicroDist != 0)
				continue;

            let midiNum = 'MicroDist="' + note.MicroDist + '"';
            let microDist = 'MidiNum="' + note.MidiNum + '"';
            let keyId = 'h_' + note.MidiNum + '_' + note.MicroDist;
            let keyClass = note.IsWhite ? 'white' : 'black';

			if (note != null && note.Cents <= this.#opts.TuningSensitivity) {
				if (this.#opts.TuningGradient) {
    				colorClass = this.#keyGradientCSS(note.Cents, this.#opts.TuningSensitivity);
					classNames += ' paired-gradient ' + colorClass;
				} else {
					classNames += ' paired-flat';
				}
			}


            html += '<div class="key ' + keyClass + '">';
            if (note.IsWhite) {
                html += '<span id="' + keyId + '" class="white" ' + midiNum + ' ' + microDist + '>' + note.Key + '<sub>' + note.Octave + '</sub></span>';
            } else {
                html += '<span id="' + keyId + '" class="black" ' + midiNum + ' ' + microDist + '>' + note.KeyUp + '<br/>' + note.KeyDown + '</span>';
            }
            html += '</div>';
        }
        html += '</div>';
        return html;
    }
*/

    #getVerticalPiano(noteTable) {
        let bounds = noteTable.NoteBounds;
		let table = noteTable.getFlattenedTable(); 

        let html = this.#VTableTop();
        for(const row of table) {
            //if (this.#opts.PrintBlackKeys) {
				html += this.#VTableRow(row);
            //} else if (row.IsWhite) {
			//	html += this.#VTableDoubleRow(row);
			//}
        }
        html += this.#VTableBottom();
        return html;
    }

	// table printing
	#VTableTop() {
		return `
<table id="VerticalKeys" class="piano">
<tr>
	<th title="Piano Key">Key</th>
	<th title="Piano frequence">Freq</th>
	<th title="Atari Tone (AUDC)">Tone</th>
	<th title="Tone Frequency">Freq</th>
	<th title="Tuning difference between piano note and Atari note.">Cents</th>
	<th title="Piano key number">Key#</th>
	<th title="Microtonal number">Micro#</th>
</tr>`;
	}

	#VTableBottom() {
		return '</table>';
	}

	#VTableRow(row) {
		let key = this.#VTableKey(row.KeyNote, row.TIANote);
		let classNames = key.classNames;

        if (!this.#opts.PrintBlackKeys && row.KeyNote.IsBlack)
			classNames += ' hidden';

		let tiaLabel = '';
		let tiaFrequency = '';
		let tiaCents = '';
		let tiaFrequencyRounded = '';
		let tiaCentsRounded = '';

		if (row.TIANote != null) {
			tiaLabel = row.TIANote.TIALabel;
			tiaFrequency = row.TIANote.Frequency;
			tiaCents = row.TIANote.Cents;
			tiaFrequencyRounded = row.TIANote.Frequency.toFixed(2);
			tiaCentsRounded = row.TIANote.Cents.toFixed(2);
		}

		return `
<tr class="${classNames}">
<td class="key">${key.html}</td>
<td title="${row.KeyNote.Frequency} Hz">${row.KeyNote.Frequency.toFixed(2)}</td>
<td>${tiaLabel}</td>
<td title="${tiaFrequency} Hz">${tiaFrequencyRounded}</td>
<td title="${tiaCents}">${tiaCentsRounded}</td>
<td>${row.KeyNote.KeyNum}</td>
<td>${row.KeyNote.MicroId}</td>
</tr>`;
	}

	#VTableKey(keyNote, note=null) {
    	let keyId = 'v_' + keyNote.MidiNum + '_' + keyNote.MicroDist;
        let midiNum = 'MicroDist="' + keyNote.MicroDist + '"';
        let microDist = 'MidiNum="' + keyNote.MidiNum + '"';
		let micro = this.#opts.NumMicroTones > 1 ? '.' + keyNote.MicroDist : '';
		let classNames = keyNote.IsWhite ? 'white' : 'black';
		let colorClass = '';

		if (note != null && note.Cents <= this.#opts.TuningSensitivity) {
			if (this.#opts.TuningGradient) {
    			colorClass = this.#keyGradientCSS(note.Cents, this.#opts.TuningSensitivity);
				classNames += ' paired-gradient ' + colorClass;
			} else {
				classNames += ' paired-flat';
			}
		}

		let html =
`<span id="${keyId}" class="${classNames}" ${midiNum} ${microDist}
	title="${keyNote.Frequency} Hz">${keyNote.Key}</span>`;

		return { 'html': html, 'classNames': classNames, 'colorClass': colorClass };
	}

    #keyGradientCSS(cents, sensitivity=50.0) {
		let divisor = sensitivity > 0 ? sensitivity : 1;

      	// linear relative to 50 cents
        //let val = Math.min(100 - Math.round(cents/50.0*30), 100);
        // square root curve
        //let val = Math.min(100 - Math.round(Math.sqrt(cents/50) * 30), 100);

        // linear relative to tuning sensitivity: results in a range between 70% to 100%
		let magnitude = Math.round(Math.abs(cents/divisor * 30));
        let lightness = Math.max(0, Math.min(100, 100-magnitude));
        return 'color-' + lightness.toFixed(0);
	}

/*
	#VTableSingleRow(row) {
		let keyHtml = this.#VTableKey(row.KeyNote, row.TIANote);

		let style = '';
		if (row.TIANote != null && row.TIANote.Cents <= this.#opts.TuningSensitivity) {
			let rowColor = KeyOnColor;
			if (this.#opts.TuningGradient)
    			rowColor = this.#keyGradientCSS(row.TIANote.Cents, this.#opts.TuningSensitivity);
			style += "background-color:" + rowColor.key + " !important;";
		}

		let tiaLabel = '';
		let tiaFrequency = '';
		let tiaCents = '';
		let tiaFrequencyRounded = '';
		let tiaCentsRounded = '';

		if (row.TIANote != null) {
			tiaLabel = row.TIANote.TIALabel;
			tiaFrequency = row.TIANote.Frequency;
			tiaCents = row.TIANote.Cents;
			tiaFrequencyRounded = row.TIANote.Frequency.toFixed(2);
			tiaCentsRounded = row.TIANote.Cents.toFixed(2);
		}

		return `
<tr class="single" style="${style}">
<td>${keyHtml}</td>
<td title="${row.KeyNote.Frequency} Hz">${row.KeyNote.Frequency.toFixed(2)}</td>
<td>${tiaLabel}</td>
<td title="${tiaFrequency} Hz">${tiaFrequencyRounded}</td>
<td title="${tiaCents}">${tiaCentsRounded}</td>
<td>${row.KeyNote.KeyNum}</td>
<td>${row.KeyNote.MicroId}</td>
</tr>`;
	}

	#VTableKey(keyNote, note=null) {
		let className = keyNote.IsWhite ? 'white' : 'black';

		if (note != null && note.Cents <= this.#opts.TuningSensitivity) {
			if (this.#opts.TuningGradient) {
				className += ' gradient';
			} else {
				className += ' flat';
			}
		}

    	let keyId = 'v_' + keyNote.MidiNum + '_' + keyNote.MicroDist;
        let midiNum = 'MicroDist="' + keyNote.MicroDist + '"';
        let microDist = 'MidiNum="' + keyNote.MidiNum + '"';
		let micro = this.#opts.NumMicroTones > 1 ? '.' + keyNote.MicroDist : '';

		if (keyNote.IsWhite)
			return `<span id="${keyId}" class="${className}" ${midiNum} ${microDist}>${keyNote.Key}<sub>${keyNote.Octave}${micro}</sub></span>`;

		let style = '';
		if (note != null && note.Cents <= this.#opts.TuningSensitivity) {
			let rowColor = keyNote.IsWhite ? KeyColors.white : KeyColors.black;
			if (this.#opts.TuningGradient) {
    			rowColor = this.#keyGradientCSS(note.Cents, this.#opts.TuningSensitivity);
				style += "background-color:" + rowColor.key + " !important;";
			}
		}

        if (this.#opts.PrintBlackKeys)
			return `<span id="${keyId}" class="${className}" style="${style}" ${midiNum} ${microDist}>${keyNote.Key}<sub>${keyNote.Octave}${micro}</sub></span>`;

		return `<span id="${keyId}" class="${className}" style="${style}" ${midiNum} ${microDist} title="${keyNote.Frequency} Hz">${keyNote.Key}</span>`;
	}

    #keyGradientCSS(cents, sensitivity=50.0) {
		let divisor = sensitivity > 0 ? sensitivity : 1;

      	// linear relative to 50 cents
        //let val = Math.min(100 - Math.round(cents/50.0*30), 100);
        // square root curve
        //let val = Math.min(100 - Math.round(Math.sqrt(cents/50) * 30), 100);

        // linear relative to tuning sensitivity: results in a range between 70% to 100%
        let lightness = Math.min(100 - Math.abs(Math.round(cents / divisor * 30, 100)));
        let keyColor = 'hsl(220deg,30%,' + lightness + '%)';
        return { text:"#000", key:keyColor };
	}
*/
	#VTableDoubleRow(row) {
		if (row.IsBlack)
			return '';

		let whiteKey = this.#VTableKey(row.KeyNote, row.TIANote);
		let blackKey = '';
		if (row.SharpKeyNote != null)
			blackKey = this.#VTableKey(row.SharpKeyNote, row.TIASharpNote);

		let style = '';
		if (row.TIANote != null && row.TIANote.Cents <= this.#opts.TuningSensitivity) {
			let rowColor = row.KeyNote.IsWhite ? KeyColors.white : KeyColors.black;

			if (this.#opts.TuningGradient)
    			rowColor = this.#keyGradientCSS(row.TIANote.Cents, this.#opts.TuningSensitivity);

			style += "background-color:" + rowColor.key + " !important;";
		}

		let tiaLabel = '';
		let tiaFrequency = '';
		let tiaCents = '';
		let tiaFrequencyRounded = '';
		let tiaCentsRounded = '';

		if (row.TIANote != null) {
			tiaLabel = row.TIANote.TIALabel;
			tiaFrequency = row.TIANote.Frequency;
			tiaCents = row.TIANote.Cents;
			tiaFrequencyRounded = row.TIANote.Frequency.toFixed(2);
			tiaCentsRounded = row.TIANote.Cents.toFixed(2);
		}

		return `
<tr class="double" style="${style}">
<td>${whiteKey}${blackKey}</td>
<td title="${row.KeyNote.Frequency} Hz">${row.KeyNote.Frequency.toFixed(2)}</td>
<td>${tiaLabel}</td>
<td title="${tiaFrequency} Hz">${tiaFrequencyRounded}</td>
<td title="${tiaCents}">${tiaCentsRounded}</td>
<td>${row.KeyNote.KeyNum}</td>
<td>${row.KeyNote.MicroId}</td>
</tr>`;
	}

	#VTableSingleRow(row) {
		let keyHtml = this.#VTableKey(row.KeyNote, row.TIANote);

		let style = '';
		if (row.TIANote != null && row.TIANote.Cents <= this.#opts.TuningSensitivity) {
			let rowColor = KeyOnColor;
			if (this.#opts.TuningGradient)
    			rowColor = this.#keyGradientCSS(row.TIANote.Cents, this.#opts.TuningSensitivity);
			style += "background-color:" + rowColor.key + " !important;";
		}

		let tiaLabel = '';
		let tiaFrequency = '';
		let tiaCents = '';
		let tiaFrequencyRounded = '';
		let tiaCentsRounded = '';

		if (row.TIANote != null) {
			tiaLabel = row.TIANote.TIALabel;
			tiaFrequency = row.TIANote.Frequency;
			tiaCents = row.TIANote.Cents;
			tiaFrequencyRounded = row.TIANote.Frequency.toFixed(2);
			tiaCentsRounded = row.TIANote.Cents.toFixed(2);
		}

		return `
<tr class="single" style="${style}">
<td>${keyHtml}</td>
<td title="${row.KeyNote.Frequency} Hz">${row.KeyNote.Frequency.toFixed(2)}</td>
<td>${tiaLabel}</td>
<td title="${tiaFrequency} Hz">${tiaFrequencyRounded}</td>
<td title="${tiaCents}">${tiaCentsRounded}</td>
<td>${row.KeyNote.KeyNum}</td>
<td>${row.KeyNote.MicroId}</td>
</tr>`;
	}

}
