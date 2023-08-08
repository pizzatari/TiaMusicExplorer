import { Music } from "../Music/Music.js";

export class PageUI {
    #opts = null;
    #elems = null;

    // elems = { horizPiano: htmlElement, vertPiano: htmlElement }
    constructor(opts, elems) {
        this.#opts = opts;
        this.#elems = elems;
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
        let html = 
            '<table id="VerticalKeys" class="piano">' + 
            '<tr>' + 
            '<th title="Piano Key">Key</th>' + 
            '<th title="Piano frequence">Freq</th>' + 
            '<th title="Atari Tone (AUDC)">Tone</th>' + 
            '<th title="Tone Frequency">Freq</th>' + 
            '<th title="Tuning difference between piano note and Atari note.">Cents</th>' + 
            '<th title="Piano key number">Key#</th>' + 
            '<th title="Microtonal number">Micro#</th>' + 
            '</tr>';

        let bounds = noteTable.NoteBounds;

        for(const [microId, noteGroup] of noteTable) {
            let pivotNote = noteGroup.getBestNote();
            let note = pivotNote; // TODO: make this TIANote
            let keyId = 'v_' + note.MidiNum + '_' + note.MicroDist;

            if (pivotNote.IsBlack && this.#opts.PrintBlackKeys) {
                html += '<tr class="black">';
                html += '<td>' + '<span id="' + keyId + '" class="black">' + pivotNote.KeyUp + ' ' + pivotNote.KeyDown + '</span></td>';
                html += '<td title="' + pivotNote.Frequency + ' Hz">' + pivotNote.getFrequency() + '</td>';
                html += '<td>' + note.Key + '</td>';
                html += '<td title="' + note.Frequency + ' Hz">' + note.getFrequency() + '</td>';
                html += '<td>' + note.getCentsBetween(pivotNote) + '</td>';
                html += '<td>' + note.KeyNum + '</td>';
                html += '<td>' + note.MicroId + '</td>';
                html += '</tr>';

            } else if (pivotNote.IsWhite) {
                let blackHtml = '';
                if (!this.#opts.PrintBlackKeys) {
                    let sharpNote = pivotNote.getSharpNote();
                    if (sharpNote != null) {
                        let id = 'v_' + sharpNote.MidiNum + '_' + sharpNote.MicroDist;
                        if (sharpNote.MicroId >= bounds.firstMicroId && sharpNote.MicroId <= bounds.lastMicroId) {
                            blackHtml = '<span id="' + id + '" class="black" MidiNum="' + sharpNote.MidiNum + '" MicroDist="' + sharpNote.MicroDist + '">' + sharpNote.KeyUp + ' ' + sharpNote.KeyDown + '</span>';
                        }
                    }
                }

                let whiteHtml = '<span id="' + keyId + '" class="white" MidiNum="' + pivotNote.MidiNum + '" MicroDist="' + pivotNote.MicroDist + '">' + pivotNote.Key + pivotNote.Octave + '</span>';

                html += '<tr class="white">';
                html += '<td>' + whiteHtml + blackHtml + '</td>';
                html += '<td title="' + pivotNote.Frequency + ' Hz">' + pivotNote.getFrequency() + '</td>';
                html += '<td>' + note.Key + '</td>';
                html += '<td title="' + note.Frequency + ' Hz">' + note.getFrequency() + '</td>';
                html += '<td>' + note.getCentsBetween(pivotNote) + '</td>';
                html += '<td>' + note.KeyNum + '</td>';
                html += '<td>' + note.MicroId + '</td>';
                html += '</tr>';
            }
        }

        html += '</table>';
        return html;
    }
}
