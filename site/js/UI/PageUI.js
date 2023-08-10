import { Music } from "../Music/Music.js";

export class PageUI {
    #opts = null;
    #elems = null;

    constructor(opts) {
        this.#opts = opts;
    	this.#elems = {
        	body: $('body'),
        	horizPiano: $('#PianoRoll'),
        	vertPiano: $('#PianoTab')
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

    log(msg) {
        let elem = document.querySelector('#ConsoleLog');
        elem.innerHTML += msg + "<br/>";
    }

    updateNoteTables(noteTable) {
        this.#elems.horizPiano.html(this.#getHorizontalPiano(noteTable.PivotNoteList));
        this.#elems.vertPiano.html(this.#getVerticalPiano(noteTable));
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

    #getHorizontalPiano(noteList) {
        let html = '<div id="HorizontalKeys" class="piano">';
        for(const note of noteList) {
			if (note.MicroDist != 0)
				continue;

            let midiNum = 'MicroDist="' + note.MicroDist + '"';
            let microDist = 'MidiNum="' + note.MidiNum + '"';
            let keyId = 'h_' + note.MidiNum + '_' + note.MicroDist;
            let keyClass = note.IsWhite ? 'white' : 'black';

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

    #getVerticalPiano(noteTable) {
        let bounds = noteTable.NoteBounds;
		let table = noteTable.getFlattenedTable(); 

        let html = this.#VTableTop();
        for(let row of table) {
            if (this.#opts.PrintBlackKeys) {
				html += this.#VTableSingleRow(row);
            } else if (row.IsWhite) {
				html += this.#VTableDoubleRow(row);
			}
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

	#VTableDoubleRow(row) {
		if (row.IsBlack)
			return '';

if (row.Key == 'C')
	console.log("key C");

		let micro = (this.#opts.NumMicroTones > 1 ? '.' + row.MicroDist : '');
        let midiNum = 'MicroDist="' + row.MicroDist + '"';
        let microDist = 'MidiNum="' + row.MidiNum + '"';
    	let keyId = 'v_' + row.MidiNum + '_' + row.MicroDist;

		let whiteKey = '<span id="' + keyId + '" class="white" ' + midiNum + ' ' + microDist + '>' + row.Key + '<sub>' + row.Octave + micro + '</sub></span>';
		let blackKey = '';

		if (row.SharpNote != null) {
    		let bKeyId = 'v_' + row.SharpNote.MidiNum + '_' + row.SharpNote.MicroDist;
        	let bMidiNum = 'MicroDist="' + row.SharpNote.MicroDist + '"';
        	let bMicroDist = 'MidiNum="' + row.SharpNote.MidiNum + '"';
			blackKey = '<span id="' + bKeyId + '" class="black" ' + bMidiNum + ' ' + bMicroDist + '>' + row.SharpNote.KeyUp + ' ' + row.SharpNote.KeyDown + '</span>';
		}

		return `
<tr class="double">
<td>${whiteKey}${blackKey}</td>
<td title="${row.Frequency} Hz">${row.FrequencyRounded}</td>
<td>${row.TIALabel}</td>
<td title="${row.TIAFrequency} Hz">${row.TIAFrequencyRounded}</td>
<td title="${row.Cents}">${row.CentsRounded}</td>
<td>${row.KeyNum}</td>
<td>${row.MicroId}</td>
</tr>`;
	};

	#VTableSingleRow(row) {
		let micro = (this.#opts.NumMicroTones > 1 ? '.' + row.MicroDist : '');
		let className = row.IsWhite ? 'white' : 'black';
    	let keyId = 'v_' + row.MidiNum + '_' + row.MicroDist;
		let keyHtml = '';

		if (row.IsWhite)
			keyHtml = '<span id="' + keyId + '" class="white">' + row.Key + '<sub>' + row.Octave + micro + '</sub></span>';
		else
			keyHtml = '<span id="' + keyId + '" class="black">' + row.KeyUp + ' ' + row.KeyDown + ' <sub>' + row.Octave + micro + '</sub></span>';

		return `
<tr class="single">
<td>${keyHtml}</td>
<td title="${row.Frequency} Hz">${row.FrequencyRounded}</td>
<td>${row.TIALabel}</td>
<td title="${row.TIAFrequency} Hz">${row.TIAFrequencyRounded}</td>
<td title="${row.Cents}">${row.CentsRounded}</td>
<td>${row.KeyNum}</td>
<td>${row.MicroId}</td>
</tr>`;
	}
}
