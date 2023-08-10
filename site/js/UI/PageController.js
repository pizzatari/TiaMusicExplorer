import { PageUI } from "./PageUI.js"
import { Music } from "../Music/Music.js"
import { Synth } from "../Music/Synth.js"
import { MidiParser, MidiCC } from "../MUsic/Midi.js"
import { NoteListBuilder } from "../MUsic/NoteListBuilder.js"


/*
const UPDATE_PIANO = 1;
const UPDATE_TIA = 2;
const UPDATE_ALL = PIANO_UPDATE | TIA_UPDATE:
*/

export class PageForm extends EventTarget {
	#opts = null;
	#music = null;

    #formElements = [
        'VideoFormatId',
		'AtariTone0Id', 'AtariTone1Id', 'AtariTone2Id',
		'TuningMethodId',
        'A4FrequencyId', 'A4FrequencyRangeId',
        'CentTransposeId', 'CentTransposeId',
		'NumMicroTonesId', 'NumMicroTonesRangeId',
        'TuningSensitivityId', 'TuningSensitivityRangeId', 'TuningGradientId',
        'PrintBlackKeysId', 'PrintGeometryId', 'JumpToFirstId', 'ShrinkPianoId',
        'InstrumentId', 'VolumeId', 'PolyphonyId'
    ];

	constructor(opts, music) {
		super();
		this.#opts = opts;
		this.#music = music;
		this.#setHandlers();

/*
        for (let elemId of this.#formElements) {
			let elem = document.querySelector('#' + elemId);
			if (elem != null)
            	elem.addEventListener('change', (evt) => { this.#update(evt) });
			else
				console.log("PageForm: form element was not found: " + elemId);
		}
*/
	}

	#setHandlers() {
    	let validators = {
        	'VideoFormatId': (evt) => { this.#update({ atari: true }) },
        	'AtariTone0Id': (evt) => { this.#update({ atari: true }) },
        	'AtariTone1Id': (evt) => { this.#update({ atari: true }) },
        	'AtariTone2Id': (evt) => { this.#update({ atari: true }) },
        	'TuningMethodId': (evt) => { this.#update({ piano: true }) },
        	'TuningGradientId': (evt) => { this.#update({ atari: true }) },
        	'PrintBlackKeysId': (evt) => { this.#update({ full: true }) },
        	'PrintFrequencyId': (evt) => { this.#update({ full: true }) },
        	'ShrinkPianoId': (evt) => { this.#update({ full: true }) },
        	//'InstrumentId': (evt) => { this.#resetSynth(e.target.value) },
        	//'PolyphonyId': (evt) => { this.#resetSynth(document.querySelector('#InstrumentId').value) }
        	'A4FrequencyId': (evt) => {
            	let value = Math.max(parseInt(evt.target.value), 1);
            	document.querySelector('#A4FrequencyRangeId').value = value;
				this.#music.A4Frequency = value;
				this.#update({ full: true });
        	},
        	'A4FrequencyRangeId': (evt) => {
            	let value = Math.max(parseInt(evt.target.value), 1);
            	document.querySelector('#A4FrequencyId').value = value;
				this.#music.A4Frequency = value;
				this.#update({ full: true });
        	},
        	'CentTransposeId': (evt) => {
            	let value = parseInt(evt.target.value);
            	document.querySelector('#CentTransposeRangeId').value = value;
				this.#music.CentTranspose = value;
				this.#update({ full: true });
        	},
        	'CentTransposeRangeId': (evt) => {
            	let value = parseInt(evt.target.value);
            	document.querySelector('#CentTransposeId').value = value;
				this.#music.CentTranspose = value;
				this.#update({ full: true });
        	},
        	'NumMicroTonesId': (evt) => {
            	let value = Math.max(parseInt(evt.target.value), 1);
            	document.querySelector('#NumMicroTonesRangeId').value = value;
				this.#music.NumMicroTones = value;
				this.#update({ full: true });
        	},
        	'NumMicroTonesRangeId': (evt) => {
            	let value = Math.max(parseInt(evt.target.value), 1);
            	document.querySelector('#NumMicroTonesId').value = value;
				this.#music.NumMicroTones = value;
				this.#update({ full: true });
        	},
        	'TuningSensitivityId': (evt) => {
            	let value = Math.max(parseInt(evt.target.value), 0);
            	document.querySelector('#TuningSensitivityRangeId').value = value;
				this.#music.TuningSensitivity = value;
				this.#update({ atari: true });
        	},
        	'TuningSensitivityRangeId': (evt) => {
            	document.querySelector('#TuningSensitivityId').value = Math.max(parseInt(evt.target.value), 0)
				this.#music.TuningSensitivity = value;
				this.#update({ atari: true });
        	},
			/*
        	'VolumeId': (e) => { this.#synth.MasterVolume = parseInt(document.querySelector('#VolumeId').value) / 127.0; },
        	'InstrumentId': (e) => {
            	switch(e.target.value) {
                	case 'tia':
                    	$('#PianoOptsId').hide();
                    	break;
                	case 'piano':
                	default:
                    	$('#PianoOptsId').show();
                    	break;
            	}
        	},
        	//'InstrumentId':             (evt) => { this.#resetSynth(e.target.value) },
        	//'PolyphonyId':              (evt) => { this.#resetSynth(document.querySelector('#InstrumentId').value) }
			*/
    	};

        for (let id in validators) {
			let elem = document.querySelector('#' + id);
			if (elem != null) {
            	elem.addEventListener('change',
                	(evt) => { validators[id](evt); }
				);
			} else {
				console.log("HTML element was not found: " + id);
			}
        }
	}

	#update(update) {
		let updated = update.full || update.piano || update.atari;
		if (updated) {
        	this.#opts.readFromForm();
        	this.#opts.saveToStorage();
		}

		if (update.full) { 
			super.dispatchEvent(new Event("fullupdate"));
		} else {
			if (update.piano) {
				super.dispatchEvent(new Event("pianoupdate"));
			} else if (update.atari) {
				super.dispatchEvent(new Event("atariupdate"));
			}
		}
	}
}

export class PageController {
    #opts = null;
    #pageUI = null;
	#pageForm = null;
	#music = null;

    #synth = null;
    #midi = null;
    #midiParser = null;

    constructor(opts) {
        this.#opts = opts;
        this.#pageUI = new PageUI(opts);
    	this.#music = this.getMusic(opts);
		this.#pageForm = new PageForm(opts, this.#music);
		this.#updateNoteTables();

		this.#pageForm.addEventListener("fullupdate", (e) => {
        	this.#updateNoteTables();
        	this.#updateSynth();
		});
		this.#pageForm.addEventListener("pianoupdate", (e) => {
        	this.#updateNoteTables();
        	this.#updateSynth();
		});
		this.#pageForm.addEventListener("atariupdate", (e) => {
        	this.#updateNoteTables();
        	this.#updateSynth();
		});

/*
    	this.#music.addEventListener("musicupdate", (e) => {
        	this.#updateNoteTables();
        	this.#updateSynth();
    	});
*/
    }

	get PageUI() { return this.#pageUI }
	get Music() { return this.#music }
	get Synth() { return this.#synth }

    addSynth(s) {
        this.#synth = s;
        this.#setHPianoHandlers();
        this.#setVPianoHandlers();
		this.#setFormHandlers();
    }

    addMIDIAccess(m) {
        this.#midi = m;

        console.log("scanning midi input ports");
        this.#refreshMidiPorts();
        this.#setMidiHandlers();

        // handle keyboard insertion and removal
        this.#midi.addEventListener('statechange',
            (evt) => {
                console.log("refreshing midi input ports");
                this.#refreshMidiPorts();
            }
        );

        this.#midiParser = new MidiParser();
    }

	getMusic(opts) {
		let music = new Music();
    	music.A4Frequency = opts.A4Frequency;
    	music.CentTranspose = opts.CentTranspose;
    	music.NumMicroTones = opts.NumMicroTones;
    	music.FrequencyPrecision = opts.FrequencyPrecision;
    	music.CentPrecision = opts.CentPrecision;
		return music;
	}

	#updateNoteTables() {
    	let tiaArgs = { audc: this.#opts.getAtariTone(0) };
    	let pianoNotes = NoteListBuilder.getPianoNotes(this.#music);
    	let tiaNotes = NoteListBuilder.getTIANotes(this.#music, tiaArgs);
    	let noteTable = NoteListBuilder.getNoteTable(pianoNotes, tiaNotes);
    	this.#pageUI.updateNoteTables(noteTable);
	}

    #updateSynth() {
		this.#synth.restart();
	}

    #refreshMidiPorts() {
        console.log("Found " + this.#midi.inputs.size + " midi inputs");
        this.#pageUI.clearMidiLists();
        for (let [id, input] of this.#midi.inputs) {
            this.#pageUI.addMidiInput(input.id, input.name, input.manufacturer, input.version);
        }
    }

    // handlers for form input fields
    #setFormHandlers() {
        // list of elements handled
        let formElements = [
            'VideoFormatId', 'AtariTone0Id', 'AtariTone1Id', 'AtariTone2Id', 'TuningMethodId',
            'A4FrequencyId', 'A4FrequencyRangeId',
            'CentTransposeId', 'CentTransposeId', 'NumMicroTonesId', 'NumMicroTonesRangeId',
            'TuningSensitivityId', 'TuningSensitivityRangeId', 'TuningGradientId',
            'PrintBlackKeysId', 'PrintGeometryId', 'JumpToFirstId', 'ShrinkPianoId',
            'InstrumentId', 'VolumeId', 'PolyphonyId'
        ];

        // simple processing
        let simpleHandlers = {
            'A4FrequencyId':            (e) => { document.querySelector('#A4FrequencyRangeId').value = Math.max(parseInt(e.target.value), 1) },
            'A4FrequencyRangeId':       (e) => { document.querySelector('#A4FrequencyId').value = Math.max(parseInt(e.target.value), 1) },
            'CentTransposeId':          (e) => { document.querySelector('#CentTransposeId').value = e.target.value },
            'CentTransposeId':          (e) => { document.querySelector('#CentTransposeId').value = e.target.value },
            'NumMicroTonesId':          (e) => { document.querySelector('#NumMicroTonesRangeId').value = Math.max(parseInt(e.target.value), 1) },
            'NumMicroTonesRangeId':     (e) => { document.querySelector('#NumMicroTonesId').value = Math.max(parseInt(e.target.value), 1) },
            'TuningSensitivityId':      (e) => { document.querySelector('#TuningSensitivityRangeId').value = Math.max(parseInt(e.target.value), 0) },
            'TuningSensitivityRangeId': (e) => { document.querySelector('#TuningSensitivityId').value = Math.max(parseInt(e.target.value), 0) },
            'VolumeId':                 (e) => { this.#synth.MasterVolume = parseInt(document.querySelector('#VolumeId').value) / 127.0; },
/*
            'InstrumentId':             (e) => {
                switch(e.target.value) {
                    case 'tia':
                        $('#PianoOptsId').hide();
                        break;
                    case 'piano':
                    default:
                        $('#PianoOptsId').show();
                        break;
                }
            },
*/
        };

        // these trigger data pulls
        let dataUpdaters = {
/*
            'VideoFormatId':            (e) => { this.#updateAtari() },
            'AtariTone0Id':             (e) => { this.#updateAtari() },
            'AtariTone1Id':             (e) => { this.#updateAtari() },
            'AtariTone2Id':             (e) => { this.#updateAtari() },
            'TuningMethodId':           (e) => { this.#updatePiano() },
            'A4FrequencyId':                 (e) => { this.#updateAll() },
            'A4FrequencyRangeId':            (e) => { this.#updateAll() },
            'CentTransposeId':              (e) => { this.#updateAll() },
            'CentTransposeId':         (e) => { this.#updateAll() },
            'NumMicroTonesId':          (e) => { this.#updateAll() },
            'NumMicroTonesRangeId':     (e) => { this.#updateAll() },
            'TuningSensitivityId':      (e) => { this.#updateAtari() },
            'TuningSensitivityRangeId': (e) => { this.#updateAtari() },
            'TuningGradientId':         (e) => { this.#updateAtari() },
            'ShrinkPianoId':            (e) => { this.#updateAll() },
            'InstrumentId':             (e) => { this.#resetSynth(e.target.value) },
            'PolyphonyId':              (e) => { this.#resetSynth(document.querySelector('#InstrumentId').value) }
*/
        };

        for (let elemId of formElements) {
			let elem = document.querySelector('#' + elemId);
			if (elem == null) {
				console.log("HTLM element was not found: " + elemId);
				continue;
			}

            elem.addEventListener('change',
                (e) => {
                    if (simpleHandlers[elemId] != null)
                        simpleHandlers[elemId](e);

                    // push form options to storage
                    this.#opts.readFromForm();
                    this.#opts.saveToStorage();

					let fields = { 
						A4Frequency: this.#opts.A4Frequency,
                    	NumTranspose: this.#opts.Transpose,
                    	NumMicroTones: this.#opts.NumMicroTones,
                    	TuningSensitivity: this.#opts.TuningSensitivity
					}
					this.#music.setFields(fields);

                    if (dataUpdaters[elemId] != null)
                        dataUpdaters[elemId](e);

					//this.#page.update(this.#noteJoiner);
					//this.#setupMouseHandlers();
                }
            );
        }
    }

    #setHPianoHandlers() {
        let piano = this.#pageUI.HorizontalKeys;

        // div.piano > div > span
        for (var i=0; i < piano.childNodes.length; i++) {
            let key = piano.childNodes[i].childNodes[0];

            if (typeof key != 'undefined') {
                let midiNum = key.getAttribute('midinum');
                let microDist = key.getAttribute('microDist');

                key.addEventListener("mousedown", (e) => {
                    if (e.buttons & 1) {
                        this.#synth.ActiveInstrument.allNotesOff();
                        this.#synth.ActiveInstrument.noteOn(midiNum, microDist);
                        this.#pageUI.updateKeyStatus(midiNum, microDist, 'on');
                    }
                });
                key.addEventListener("mouseenter", (e) => {
                    if (e.buttons & 1) {
                        this.#synth.ActiveInstrument.allNotesOff();
                        this.#synth.ActiveInstrument.noteOn(midiNum, microDist);
                        this.#pageUI.updateKeyStatus(midiNum, microDist, 'on');
                    }
                });
                key.addEventListener("mouseup", (e) => {
                    console.log("mouse up");
                    //this.#synth.ActiveInstrument.noteOff(midiNum, microDist);
                    this.#synth.ActiveInstrument.allNotesOff();
                    this.#pageUI.updateKeyStatus(midiNum, microDist, 'off');
                });
                key.addEventListener("mouseleave", (e) => {
                    console.log("mouse leave");
                    //this.#synth.ActiveInstrument.noteOff(midiNum, microDist);
                    this.#synth.ActiveInstrument.allNotesOff();
                    this.#pageUI.updateKeyStatus(midiNum, microDist, 'off');
                });
            } else {
                console.log("setHPianoHandlers: key undefined");
            }
        }
    }

    #setVPianoHandlers() {
        let table = this.#pageUI.VerticalKeys;

console.log(table);

        // table.piano > tr > td > span
        // i=1 to skip TR/TH header row
        for (let i=1; i < table.rows.length; i++) {
            for (let j=0; j < Math.min(table.rows[i].cells[0].childNodes.length, 2); j++) {
                let key = table.rows[i].cells[0].childNodes[j];

                if (typeof key == 'undefined') {
                    console.log(`setVPianoHandlers: key undefined [${i},${j}]`);
					continue;
				}

                if (key.tagName != 'SPAN') {
                    console.log(`setVPianoHandlers: wrong HTML element type [${i},${j}]`);
					continue;
				}

                let midiNum = key.getAttribute('midinum');
                let microDist = key.getAttribute('microDist');

                key.addEventListener("mousedown", (e) => {
                    if (e.buttons & 1) {
                        this.#synth.ActiveInstrument.allNotesOff();
                        this.#synth.ActiveInstrument.noteOn(midiNum, microDist);
                        this.#pageUI.updateKeyStatus(midiNum, microDist, 'on');
                    }
                });
                key.addEventListener("mouseenter", (e) => {
                    if (e.buttons & 1) {
                        this.#synth.ActiveInstrument.allNotesOff();
                        this.#synth.ActiveInstrument.noteOn(midiNum, microDist);
                        this.#pageUI.updateKeyStatus(midiNum, microDist, 'on');
                    }
                });
                key.addEventListener("mouseup", (e) => {
                    //this.#synth.ActiveInstrument.noteOff(midiNum, microDist);
                    this.#synth.ActiveInstrument.allNotesOff();
                    this.#pageUI.updateKeyStatus(midiNum, microDist, 'off');
                });
                key.addEventListener("mouseleave", (e) => {
                    //this.#synth.ActiveInstrument.noteOff(midiNum, microDist);
                    this.#synth.ActiveInstrument.allNotesOff();
                    this.#pageUI.updateKeyStatus(midiNum, microDist, 'off');
                });
            }
        }
    }

    #setMidiHandlers(notifyHandler) {
        // listening to all midi keyboard inputs
        this.#midi.inputs.forEach(
            (input) => {
                input.addEventListener('midimessage',
                    (evt) => {
                        //this.#midiDebugOutput(evt);
                        this.#handleMidiMessage(evt);
                    }
                );
            }
        );
    }

    #handleMidiMessage(evt) {
        let parser = this.#midiParser;

        parser.parse(evt.data);

        if (parser.IsNote) {
            if (parser.NoteOn) {
                let note = this.#synth.ActiveInstrument.noteOn(parser.MidiNum, 0, parser.Velocity/127);
                if (note != null)
                    this.#pageUI.updateKeyStatus(parser.MidiNum, 0, 'on');
                else
                    this.#pageUI.updateKeyStatus(parser.MidiNum, 0, 'error');

            } else if (parser.NoteOff) {
                this.#synth.ActiveInstrument.noteOff(parser.MidiNum, 0);
                this.#pageUI.updateKeyStatus(parser.MidiNum, 0, 'off');

            } else if (parser.SustainOn) {
                    //this.#synth.SustainOn();

            } else if (parser.SustainOff) {
                    //this.#synth.SustainOff();

            } else if (parser.IsControl) {
                if (parser.ControlKey == MidiCC.VOLUME || parser.ControlKey == MidiCC.ALESIS_VOLUME) {
					this.#pageUI.MasterVolume = parser.value;
                    this.#synth.MasterVolume = parser.Value / 127.0;
                }
            }

        } else if (parser.IsControl) {
        }
    }

    #midiDebugOutput(evt) {
        let str = '';
        for (var i=0; i < evt.data.length; i++) {
            str += "0x" + evt.data[i].toString(16) + " ";
        }
        console.log(str);
    }
}


/*
        for (let [id, input] of this.#midi.inputs) {
            input.value.onmidimessage = (message) => {
                this.#midiParser.parse(message);

                if (this.#midiParser.NoteOn) {
                    let noteFound = this.#synth.noteOn(this.#midiParser.MidiNote, 0, this.#midiParser.Velocity/127.0);
                    let elems = document.querySelectorAll('.mn_' + this.#midiParser.MidiNote + '_0');
                    if (noteFound != null) {
                        for (let elem of elems)
                            elem.classList.add('NoteOn');

                        noteElem.innerHTML = noteFound.Letter + " (" + (Math.round(noteFound.Frequency*100)/100) + " Hz)";
                    } else {
                        for (let elem of elems)
                            elem.classList.add('NoteError');
                    }

                } else if (this.#midiParser.NoteOff) {
                    let noteFound = this.#synth.noteOff(this.#midiParser.MidiNote, 0);
                    let elems = document.querySelectorAll('.mn_' + this.#midiParser.MidiNote + '_0');
                    if (noteFound != null) {
                        for (let elem of elems)
                            elem.classList.remove('NoteOn');
                    } else {
                        for (let elem of elems)
                            elem.classList.remove('NoteError');
                    }

                } else if (this.#midiParser.SustainOn) {
                        this.#synth.sustainOn();

                } else if (this.#midiParser.SustainOff) {
                        this.#synth.sustainOff();

                } else if (this.#midiParser.IsControl) {
                    if (this.#midiParser.ControlKey == MidiCC.VOLUME || this.#midiParser.ControlKey == MidiCC.ALESIS_VOLUME) {
                        let volume = document.querySelector('#VolumeId');
                        volume.value = this.#midiParser.Value;
                        this.#synth.MasterVolume = this.#midiParser.Value / 127.0;
                    }
                }
            }
        }
    }
}
*/
