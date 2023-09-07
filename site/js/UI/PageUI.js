import { Music } from "../Music/Music.js";
import { NoteTable, NoteGroup } from "../Music/NoteListBuilder.js";

const KeyOnColor = { text: '#000', key: '#fff', image: '' };
const KeyColors = {
	white: { text: '#000', key: '#fff', image: '' },
	black: { text: '#fff', key: '#000', image: '' }
};

export class PageUI {
    #opts = null;
    #mainForm = null;
    #horizontalPiano = null;
    #verticalPiano = null;

    constructor(opts, mainForm) {
        this.#opts = opts;
        this.#mainForm = mainForm;
        this.#horizontalPiano = document.querySelector('#HPiano');
        this.#verticalPiano = document.querySelector('#VPiano');
    }

    set MainForm(frm) { this.#mainForm = frm }
    get MainForm() { return this.#mainForm }

    get MinVolume() { return 0 };
    get MaxVolume() { return 127 };

    // 0 <= volume <= 127
    set MasterVolume(val) {
		let volumeElem = this.MainForm.elements['Volume'];
        volumeElem.value = val;
		volumeElem = this.MainForm.elements['VolumeRange'];
        volumeElem.value = val;
    }

    get MasterVolume() {
		let val = parseInt(this.MainForm.elements['Volume'].value);
        val = Math.max(this.MinVolume, val);
        val = Math.min(this.MaxVolume, val);
        return val;
    }

	set Polyphony(val) {
		let elem = this.MainForm.elements['Polyphony'];
		elem.value = val;
	}

    get HorizontalKeys() {
        return document.querySelector('#HorizontalKeys');
    }

    get VerticalKeys() {
        return document.querySelector('#VerticalKeys');
    }

    updatePianos(noteTable) {
        this.#horizontalPiano.innerHTML = this.#getHorizontalPiano(noteTable);
        this.#verticalPiano.innerHTML = this.#getVerticalPiano(noteTable);
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

    updateScale(name) {
    	if (name == 'TIA') {
        	this.disableScale('TIA');
    	} else {
        	this.enableScale(this.#opts.Scale);
    	}
    }

    enableSynth() {
		let elem = document.querySelector('#SynthId');
        elem.classList.remove('disabled');
    }

    disableSynth() {
		let elem = document.querySelector('#SynthId');
        elem.classList.add('disabled');
    }

	enableScale(name) {
		let elem = document.querySelector('#ScaleId');
        elem.value = name;
        elem.disabled = false;
	}

	disableScale() {
		let elem = document.querySelector('#ScaleId');
        elem.disabled = true;
	}

	enablePolyphony() {
		let elem = document.querySelector('#PolyphonyId');
        elem.value = name;
        elem.disabled = false;
	}

	disablePolyphony() {
		let elem = document.querySelector('#PolyphonyId');
        elem.disabled = true;
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

    loadCartridge(url) {
        Javatari.CARTRIDGE_URL = url;
        var paused = Javatari.room.console.systemPause(true);
        Javatari.fileLoader.readFromURL(Javatari.CARTRIDGE_URL, Javatari.fileLoader.OPEN_TYPE.AUTO, 0, true, false, function () {
            if (!paused) Javatari.room.console.systemPause(false);
            Javatari.room.console.powerOn();
        });
    }

    scrollTo(midiNum) {
		let id = '#v_' + midiNum + '_0';
		$('html, body').animate({
   	   	   scrollTop: $(id).offset().top
		}, 1000);
    }

    clampVolume(volume) {
        volume = Math.max(this.MinVolume, volume);
        volume = Math.min(this.MaxVolume, volume);
        return volume;
    }

    toStatusMsg(msg, cssClass) {
        return '[<span class="' + cssClass + '">' + msg + '</span>]';
    }

    log(msg) {
        let elem = document.querySelector('#ConsoleLog');
        elem.innerHTML += msg + "<br/>";
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
            let colorClass = '';
            let excluded = '';

			if (note != null) {
                if (Math.abs(note.Cents) <= this.#opts.TuningSensitivity) {
				    if (this.#opts.TuningGradient) {
    				    colorClass = ' ' + this.#keyGradientCSS(note.Cents, this.#opts.TuningSensitivity);
					    classNames += ' paired-gradient' + colorClass;
				    } else {
					    classNames += ' paired-flat';
				    }
			    } else {
                    excluded = "excluded='yes'";
                }
            }

            html += `<div class="key ${classNames}">`;
            if (keyNote.IsWhite) {
                html += `<span id="${keyId}" class="${classNames}" ${midiNum} ${microDist} ${excluded}>${keyNote.Key}<sub>${keyNote.Octave}</sub></span>`;
            } else {
                html += `<span id="${keyId}" class="${classNames}" ${midiNum} ${microDist} ${excluded}>${keyNote.KeyUp}<br/>${keyNote.KeyDown}</span>`;
            }
            html += '</div>';
        }
        html += '</div>';
        return html;
    }

    #getVerticalPiano(noteTable) {
        let bounds = noteTable.NoteBounds;
		let table = noteTable.getFlattenedTable(); 

        let html = this.#VTableTop();
        for(const row of table) {
            if (this.#opts.StretchFit && (row.MicroId < bounds.firstMicroId || row.MicroId >  bounds.lastMicroId)) 
                continue;

			html += this.#VTableRow(row);
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
	<th title="Piano key number / MIDI Key Number">Key</th>
	<th title="Microtonal number">Micro</th>
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
        let tiaMicro = '';
        let tiaKeyNum = '';
        let tiaMicroId = '';

		if (row.TIANote != null) {
			tiaLabel = row.TIANote.TIALabel;
			tiaFrequency = row.TIANote.Frequency;
			tiaCents = row.TIANote.Cents;
			tiaFrequencyRounded = row.TIANote.Frequency.toFixed(2);
			tiaCentsRounded = row.TIANote.Cents.toFixed(2);
            tiaMicro = "[" + row.TIANote.Octave + "." + row.TIANote.MicroDist + "]";
            tiaKeyNum = row.TIANote.KeyNum + "/" + row.TIANote.MidiNum;
            tiaMicroId = row.TIANote.MicroId;
		}

		return `
<tr class="${classNames}">
<td class="key">${key.html}</td>
<td title="${row.KeyNote.Frequency} Hz">${row.KeyNote.Frequency.toFixed(2)}</td>
<td>${tiaLabel}</td>
<td title="${tiaFrequency} Hz">${tiaFrequencyRounded}</td>
<td title="${tiaCents}">${tiaCentsRounded}</td>
<td>${row.KeyNote.KeyNum}/${row.KeyNote.MidiNum}</td>
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
        let excluded = '';

		if (note != null) {
            if (Math.abs(note.Cents) <= this.#opts.TuningSensitivity) {
			    if (this.#opts.TuningGradient) {
    			    colorClass = this.#keyGradientCSS(note.Cents, this.#opts.TuningSensitivity);
				    classNames += ' paired-gradient ' + colorClass;
			    } else {
				    classNames += ' paired-flat';
			    }
		    } else {
                excluded = "excluded='yes'";
            }
		}

		let html =
`<span id="${keyId}" class="${classNames}" ${midiNum} ${microDist} ${excluded}
	title="${keyNote.Frequency} Hz">${keyNote.Label}</span>`;

		return { 'html': html, 'classNames': classNames, 'colorClass': colorClass };
	}

    #keyGradientCSS(cents, sensitivity=50.0) {
		let divisor = sensitivity > 0 ? sensitivity : 1;

      	// linear relative to 50 cents
        //let magnitude = Math.min(100 - Math.round(cents/50.0*30), 100);
        // square root curve
        //let magnitude = Math.min(100 - Math.round(Math.sqrt(cents/50) * 30), 100);

        // linear relative to tuning sensitivity: results in a range between 70% to 100%
		let magnitude = Math.round(Math.abs(cents/divisor * 50));

        let lightness = Math.max(50, Math.min(100, 100-magnitude));

        return 'color-' + lightness.toFixed(0);
	}
}
