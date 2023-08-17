import { PageUI } from "./PageUI.js"
import { Music } from "../Music/Music.js"
import { Synth } from "../Music/Synth.js"
import { MidiParser, MidiCC } from "../MUsic/Midi.js"
import { NoteListBuilder } from "../MUsic/NoteListBuilder.js"

export class PageController {
    #opts = null;
    #pageUI = null;
	#pageForm = null;
	#music = null;

    #synth = null;
    #midi = null;
    #midiParser = null;

	#noteTable = null;

    constructor(opts) {
        this.#opts = opts;
        this.#pageUI = new PageUI(opts);
    	this.#music = this.getMusic(opts);
		this.#pageForm = new PageForm(opts, this.#music, this.#pageUI.MainForm);
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

        this.#setPageHandlers();
    }

	get PageUI() { return this.#pageUI }
	get Music() { return this.#music }
	get Synth() { return this.#synth }
	get NoteTable() { return this.#noteTable }

    addSynth(s) {
        this.#synth = s;
        this.#setHPianoHandlers();
        this.#setVPianoHandlers();
    }

    addMIDIAccess(m) {
        this.#midi = m;

        this.#refreshMidiPorts();
        this.#setMidiHandlers();

        // handle MIDI keyboard insertion and removal
        this.#midi.addEventListener('statechange',
            (evt) => {
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
    	this.#noteTable = NoteListBuilder.getNoteTable(pianoNotes, tiaNotes);
    	this.#pageUI.updateNoteTables(this.#noteTable);
        this.#setHPianoHandlers();
        this.#setVPianoHandlers();
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
                    //this.#synth.ActiveInstrument.noteOff(midiNum, microDist);
                    this.#synth.ActiveInstrument.allNotesOff();
                    this.#pageUI.updateKeyStatus(midiNum, microDist, 'off');
                });
                key.addEventListener("mouseleave", (e) => {
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
                    console.log(`setVPianoHandlers: wrong HTML element type [${i},${j}] : ${key.tagName}`);
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
    }

    #midiDebugOutput(evt) {
        let str = '';
        for (var i=0; i < evt.data.length; i++) {
            str += "0x" + evt.data[i].toString(16) + " ";
        }
        console.log(str);
    }

    #setPageHandlers() {
		let noteTable = this.#noteTable;
		let pageUI = this.#pageUI;

		/*
        document.querySelector('#ShrinkPianoId').addEventListener('change',
			(evt) => {
            	let bounds = noteTable.NoteBounds;
            	if (evt.target.checked && bounds.firstMidiNum > 0)
                	pageUI.scrollTo(bounds.firstMidiNum);
			}
        );
		*/

        document.querySelector('#JumpToFirstId').addEventListener('change',
			(evt) => {
            	let bounds = noteTable.NoteBounds;
            	if (evt.target.checked && bounds.firstMidiNum > 0)
                	pageUI.scrollTo(bounds.firstMidiNum);
			}
        );
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

export class PageForm extends EventTarget {
	#opts = null;
	#music = null;
	#form = null;

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

	constructor(opts, music, form) {
		super();
		this.#opts = opts;
		this.#music = music;
		this.#form = form;
		this.#setFormHandlers();
	}

	#setFormHandlers() {
		this.#form.addEventListener('submit',
			(evt) => {
				evt.preventDefault();
				return false;
			}
		);

        document.querySelector('#ResetId').addEventListener('click', (evt) => {
            this.#opts.clearStorage();
            this.#opts.loadDefaults();
            this.#opts.writeToForm();
            this.#opts.saveToStorage();

            this.#music.A4Frequency = this.#opts.A4Freq;
            this.#music.NumTranspose = this.#opts.Transpose;
            this.#music.NumMicroTones = this.#opts.NumMicroTones;
            this.#music.TuningSensitivity = this.#opts.TuningSensitivity;

/*
            this.#updateAll();
            this.#page.update(this.#noteJoiner);
            this.#setupEventHandlers();
            this.#resetSynth("piano");
*/
        });

    	let validators = {
        	'VideoFormatId': (evt) => { this.#update({ atari: true }) },
        	'AtariTone0Id': (evt) => { this.#update({ atari: true }) },
        	'AtariTone1Id': (evt) => { this.#update({ atari: true }) },
        	'AtariTone2Id': (evt) => { this.#update({ atari: true }) },
        	'TuningMethodId': (evt) => { this.#update({ piano: true }) },
        	'TuningGradientId': (evt) => { this.#update({ full: true }) },
        	'PrintBlackKeysId': (evt) => { this.#update({ full: true }) },
        	//'PrintFrequencyId': (evt) => { this.#update({ full: true }) },
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
            	let value = Math.max(parseInt(evt.target.value), 0)
            	document.querySelector('#TuningSensitivityId').value = value;
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
        this.#opts.readFromForm();
        this.#opts.saveToStorage();

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

