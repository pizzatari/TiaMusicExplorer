import { PageUI } from "./PageUI.js"
import { Music } from "../Music/Music.js"
import { Synth } from "../Music/Synth.js"
import { MidiParser, MidiCC } from "../Music/Midi.js"
import { NoteListBuilder } from "../Music/NoteListBuilder.js"

export class PageController {
    #opts = null;
    #pageUI = null;
	#pageForm = null;
	#music = null;

    #synth = null;
    #midiAccess = null;
    #midiParser = null;

	#noteTable = null;
    #tiaNoteList = null;
    #pianoNoteList = null;

    constructor(opts, pageUI) {
        this.#opts = opts;
        this.#pageUI = pageUI;
    	this.#music = this.getMusic(opts);

        this.#pageUI.Scale = opts.Scale;
		this.#pageForm = new PageForm(opts, this, this.#pageUI.MainForm);

		this.#loadNoteLists();
    	this.PageUI.renderPianos(this.#noteTable);
    }

	get PageUI() { return this.#pageUI }
	get Music() { return this.#music }
	get Synth() { return this.#synth }
	get NoteTable() { return this.#noteTable }

    addSynth(synth) {
        this.#synth = synth;
        this.#pageUI.Polyphony = synth.ActiveInstrument.Polyphony;
    }

    addMIDIAccess(midiAccess) {
        this.#midiParser = new MidiParser();
        this.#midiAccess = midiAccess;

        // handle MIDI keyboard insertion and removal
        this.#midiAccess.addEventListener('statechange', (evt) => {
            console.notice(console.stream.midi, "midi device state change event");
            this.#updateMidiPorts();
            this.#setMidiHandlers();
        });

        this.#updateMidiPorts();
        this.#setMidiHandlers();
    }

    enable() {
        this.#setHPianoHandlers();
        this.#setVPianoHandlers(this.#opts.StretchFit);

		this.enableInstrument(this.#opts.Instrument);
		this.enableScale(this.#opts.Scale);

		this.#pageForm.addEventListener("fullupdate", (e) => {
			this.#loadNoteLists();
			this.#synth.addScale(this.#tiaNoteList);
			this.#synth.addScale(this.#pianoNoteList);

    		this.PageUI.renderPianos(this.#noteTable);
            this.#setHPianoHandlers();
            this.#setVPianoHandlers(this.#opts.StretchFit);

			this.enableInstrument(this.#opts.Instrument);
			this.enableScale(this.#opts.Scale);
		});

		this.#pageForm.addEventListener("pianoupdate", (e) => {
			this.#loadNoteLists();
			this.#synth.addScale(this.#tiaNoteList);
			this.#synth.addScale(this.#pianoNoteList);

    		this.PageUI.renderPianos(this.#noteTable);
            this.#setHPianoHandlers();
            this.#setVPianoHandlers(this.#opts.StretchFit);

			this.enableInstrument(this.#opts.Instrument);
			this.enableScale(this.#opts.Scale);
		});

		this.#pageForm.addEventListener("atariupdate", (e) => {
			this.#loadNoteLists();
			this.#synth.addScale(this.#tiaNoteList);
			this.#synth.addScale(this.#pianoNoteList);

    		this.PageUI.renderPianos(this.#noteTable);
            this.#setHPianoHandlers();
            this.#setVPianoHandlers(this.#opts.StretchFit);

			this.enableInstrument(this.#opts.Instrument);
			this.enableScale(this.#opts.Scale);
		});

        this.PageUI.MainForm.elements['JumpToFirst'].addEventListener('change',
			(evt) => {
            	let bounds = this.NoteTable.NoteBounds;
            	if (evt.target.checked && bounds.firstMidiNum > 0)
                	pageUI.scrollTo(bounds.firstMidiNum);
			}
        );
    }

    enableInstrument(instrument) {
        if (this.Synth == null)
            return;

        if (instrument == 'TIA') {
            this.Synth.enableInstrument(instrument);
            this.PageUI.disableScale('TIA');
            this.PageUI.disablePolyphony();
        } else if (instrument == 'Piano') {
            this.Synth.enableInstrument(instrument);
            this.PageUI.enableScale(this.#opts.Scale);
            this.PageUI.enablePolyphony();
        } else { // tone instrument
            this.Synth.enableInstrument('Tone');
            this.Synth.ActiveInstrument.setWaveType(instrument);
            this.PageUI.enableScale(this.#opts.Scale);
            this.PageUI.enablePolyphony();
        }

        this.PageUI.MainForm.elements['Polyphony'].value = this.Synth.ActiveInstrument.Polyphony;
        this.Synth.MasterVolume = this.PageUI.MasterVolume / this.PageUI.MaxVolume;
    }

    enableScale(scale) {
        if (this.Synth == null)
            return;

        this.Synth.enableScale(scale);
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

	#loadNoteLists() {
    	let args = {
            audc: this.#opts.AtariTones,
            mode: this.#opts.VideoFormat
        };

    	this.#noteTable = NoteListBuilder.getNoteTable(this.#music, args);
    	this.#pianoNoteList = this.#noteTable.PivotNoteList;
    	this.#tiaNoteList = this.#noteTable.NoteList;
	}

    #updateMidiPorts() {
        this.#pageUI.clearMidiLists();

        if (this.#midiAccess.inputs.size == 0) {
            console.notice(console.stream.midi, "found no midi inputs");
            return;
        }

        for (let [id, input] of this.#midiAccess.inputs) {
            this.#pageUI.addMidiInput(input.id, input.name, input.manufacturer, input.version);
            console.notice(console.stream.midi, "found input " + [input.id, input.name, input.manufacturer, input.version].join(" "));
        }
    }

    #setHPianoHandlers() {
        let piano = this.#pageUI.HorizontalKeys;

        // div.piano > div > span
        for (var i=0; i < piano.childNodes.length; i++) {
            let key = piano.childNodes[i].childNodes[0];

            if (typeof key == 'undefined') {
                console.log("setHPianoHandlers: key undefined");
                continue;
            }

            let midiNum = key.getAttribute('midinum');
            let microDist = key.getAttribute('microDist');
            let excluded = key.getAttribute('excluded');

            key.addEventListener("mousedown", (e) => {
                if (e.buttons & 1) {
                    let result = 'error';

                    this.#synth.allNotesOff();
                    if (excluded != 'yes') {
                        let note = this.#synth.noteOn(midiNum, microDist);
                        if (note != null)
                            result = 'on';
                    }

                    this.#pageUI.renderKeyState(midiNum, microDist, result);
                }
            });
            key.addEventListener("mouseenter", (e) => {
                if (e.buttons & 1) {
                    let result = 'error';

                    this.#synth.allNotesOff();
                    if (excluded != 'yes') {
                        let note = this.#synth.noteOn(midiNum, microDist);
                        if (note != null)
                            result = 'on';
                    }

                    this.#pageUI.renderKeyState(midiNum, microDist, result);
                }
            });
            key.addEventListener("mouseup", (e) => {
                this.#synth.allNotesOff();
                this.#pageUI.renderKeyState(midiNum, microDist, 'off');
            });
            key.addEventListener("mouseleave", (e) => {
                this.#synth.allNotesOff();
                this.#pageUI.renderKeyState(midiNum, microDist, 'off');
            });
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
                    console.notice(console.stream.controller, `setVPianoHandlers: key undefined [${i},${j}]`);
					continue;
				}

                if (key.tagName != 'SPAN') {
                    console.notice(console.stream.controller, `setVPianoHandlers: wrong HTML element type [${i},${j}] : ${key.tagName}`);
					continue;
				}

                let midiNum = key.getAttribute('midinum');
                let microDist = key.getAttribute('microDist');
                let excluded = key.getAttribute('excluded');

                key.addEventListener("mousedown", (e) => {
                    if (e.buttons & 1) {
                        let result = 'error';

                        this.#synth.allNotesOff();
                        if (excluded != 'yes') {
                            let note = this.#synth.noteOn(midiNum, microDist);
                            if (note != null)
                                result = 'on';
                        }

                        this.#pageUI.renderKeyState(midiNum, microDist, result);
                    }
                });
                key.addEventListener("mouseenter", (e) => {
                    if (e.buttons & 1) {
                        let result = 'error';

                        this.#synth.allNotesOff();
                        if (excluded != 'yes') {
                            let note = this.#synth.noteOn(midiNum, microDist);
                            if (note != null)
                                result = 'on';
                        }

                        this.#pageUI.renderKeyState(midiNum, microDist, result);
                    }
                });
                key.addEventListener("mouseup", (e) => {
                    this.#synth.allNotesOff();
                    this.#pageUI.renderKeyState(midiNum, microDist, 'off');
                });
                key.addEventListener("mouseleave", (e) => {
                    this.#synth.allNotesOff();
                    this.#pageUI.renderKeyState(midiNum, microDist, 'off');
                });
            }
        }
    }

    // listening to all midi keyboard inputs
    #setMidiHandlers() {
        this.#midiAccess.inputs.forEach((input) => {
            console.notice(console.stream.midi, "setting handler for " + input.id);

            input.onmidimessage = (evt) => {
                console.notice(console.stream.midi, "midimessage " + evt.type);
                //this.#midiDebugOutput(evt);

                this.#handleMidiMessage(evt);
            };
        });
    }

    #handleMidiMessage(evt) {
        let parser = this.#midiParser;

        parser.parse(evt.data);

        if (parser.NoteOn) {
            let note = this.#synth.noteOn(parser.MidiNum, 0, parser.Velocity/127);
            if (note != null)
                this.#pageUI.renderKeyState(parser.MidiNum, 0, 'on');
            else
                this.#pageUI.renderKeyState(parser.MidiNum, 0, 'error');

        } else if (parser.NoteOff) {
            this.#synth.noteOff(parser.MidiNum, 0);
            this.#pageUI.renderKeyState(parser.MidiNum, 0, 'off');

        } else if (parser.SustainOn) {
            this.#synth.SustainOn();

        } else if (parser.SustainOff) {
            this.#synth.SustainOff();

        } else if (parser.IsControl) {
            if (parser.ControlKey == MidiCC.VOLUME || parser.ControlKey == MidiCC.ALESIS_VOLUME) {
				this.#pageUI.MasterVolume = parser.Value;
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
        document.querySelector('#StretchFitId').addEventListener('change',
			(evt) => {
            	let bounds = noteTable.NoteBounds;
            	if (evt.target.checked && bounds.firstMidiNum > 0)
                	pageUI.scrollTo(bounds.firstMidiNum);
			}
        );
		*/

        pageUI.MainForm.elements['JumpToFirst'].addEventListener('change',
			(evt) => {
            	let bounds = noteTable.NoteBounds;
            	if (evt.target.checked && bounds.firstMidiNum > 0)
                	pageUI.scrollTo(bounds.firstMidiNum);
			}
        );
    }
}

export class PageForm extends EventTarget {
	#opts = null;
    #music = null;
	#controller = null;
    #pageUI = null;
	#form = null;

	constructor(opts, controller) {
		super();
		this.#opts = opts;
		this.#controller = controller;
        this.#music = controller.Music;
        this.#pageUI = controller.PageUI;
		this.#form = controller.PageUI.MainForm;
		this.#setFormHandlers();
	}

	#setFormHandlers() {
		this.#form.addEventListener('submit', (evt) => {
			evt.preventDefault();
			return false;
		});

        this.#form.elements['Reset'].addEventListener('click', (evt) => {
            this.#opts.clearStorage();
            this.#opts.loadDefaults();
            this.#opts.writeToForm(this.#form);
            this.#opts.saveToStorage();

            this.#music.A4Frequency = this.#opts.A4Freq;
            this.#music.NumTranspose = this.#opts.Transpose;
            this.#music.NumMicroTones = this.#opts.NumMicroTones;
            this.#music.TuningSensitivity = this.#opts.TuningSensitivity;
        });

    	let validators = {
        	'VideoFormat':      (evt) => {
                console.notice(console.stream.ui, "changing video format to " + this.#form.elements['VideoFormat'].value);
                this.#update({ atari: true })
				this.#pageUI.loadCartridge(this.#opts.CartridgeURL);
            },
        	'AtariTone0':       (evt) => { this.#update({ atari: true }) },
        	'AtariTone1':       (evt) => { this.#update({ atari: true }) },
        	'AtariTone2':       (evt) => { this.#update({ atari: true }) },
        	'TuningMethod':     (evt) => { this.#update({ piano: true }) },
        	'TuningGradient':   (evt) => { this.#update({ full: true }) },
        	'PrintBlackKeys':   (evt) => { this.#update({ full: true }) },
        	//'PrintFrequency': (evt) => { this.#update({ full: true }) },
        	'ShrinkPiano':      (evt) => { this.#update({ full: true }) },
        	'StretchFit':       (evt) => { this.#update({ full: true }) },
        	'JumpToFirst':      (evt) => { this.#update({ }) },
			// force instrument/scale to refresh their note lists to pickup changes while inactive
        	'Instrument':       (evt) => { this.#update({ full: true }) },
            'Scale':            (evt) => { this.#update({ full: true }) },
        	//'Polyphony':      (evt) => { this.#resetSynth(this.#form.elements['Instrument'].value) }
        	'A4Frequency':      (evt) => {
            	let value = Math.max(parseInt(evt.target.value), 1);
            	this.#form.elements['A4FrequencyRange'].value = value;
				this.#music.A4Frequency = value;
				this.#update({ full: true });
        	},
        	'A4FrequencyRange': (evt) => {
            	let value = Math.max(parseInt(evt.target.value), 1);
            	this.#form.elements['A4Frequency'].value = value;
				this.#music.A4Frequency = value;
				this.#update({ full: true });
        	},
        	'CentTranspose':    (evt) => {
            	let value = parseInt(evt.target.value);
            	this.#form.elements['CentTransposeRange'].value = value;
				this.#music.CentTranspose = value;
				this.#update({ full: true });
        	},
        	'CentTransposeRange': (evt) => {
            	let value = parseInt(evt.target.value);
            	this.#form.elements['CentTranspose'].value = value;
				this.#music.CentTranspose = value;
				this.#update({ full: true });
        	},
        	'NumMicroTones':    (evt) => {
            	let value = Math.max(parseInt(evt.target.value), 1);
            	this.#form.elements['NumMicroTonesRange'].value = value;
				this.#music.NumMicroTones = value;
				this.#update({ full: true });
        	},
        	'NumMicroTonesRange': (evt) => {
            	let value = Math.max(parseInt(evt.target.value), 1);
            	this.#form.elements['NumMicroTones'].value = value;
				this.#music.NumMicroTones = value;
				this.#update({ full: true });
        	},
        	'TuningSensitivity': (evt) => {
            	let value = Math.max(parseInt(evt.target.value), 0);
            	this.#form.elements['TuningSensitivityRange'].value = value;
				this.#music.TuningSensitivity = value;
				this.#update({ atari: true });
        	},
        	'TuningSensitivityRange': (evt) => {
            	let value = Math.max(parseInt(evt.target.value), 0)
            	this.#form.elements['TuningSensitivity'].value = value;
				this.#music.TuningSensitivity = value;
				this.#update({ atari: true });
        	},
        	'Volume':           (evt) => {
                if (this.#controller.Synth == null)
                    return;

                let volume = parseFloat(this.#form['Volume'].value);
                volume = this.#pageUI.clampVolume(volume);
                this.#form['Volume'].value = volume;
            	this.#form.elements['VolumeRange'].value = volume;
                this.#controller.Synth.MasterVolume = volume / this.#pageUI.MaxVolume;
				this.#update({});
            },
        	'VolumeRange':      (evt) => {
                if (this.#controller.Synth == null)
                    return;

                let volume = parseFloat(this.#form['VolumeRange'].value);
                volume = this.#pageUI.clampVolume(volume);
                this.#form['Volume'].value = volume;
            	this.#form.elements['Volume'].value = volume;
                this.#controller.Synth.MasterVolume = volume / this.#pageUI.MaxVolume;
				this.#update({});
            },
    	};

        for (let elemName in validators) {
			let elem = this.#form.elements[elemName];
			if (elem != null) {
            	elem.addEventListener('change',
                	(evt) => { validators[elemName](evt) }
				);
			} else {
				console.log("form input element was not found: " + elemName);
			}
        }
	}

	#update(update={}) {
        this.#opts.readFromForm(this.#form);
        this.#opts.saveToStorage();

		this.#debugOutput();

        if (update.none)
            return;

		if (update.full) { 
			super.dispatchEvent(new Event("fullupdate"));
		} else if (update.piano) {
			super.dispatchEvent(new Event("pianoupdate"));
		} else if (update.atari) {
			super.dispatchEvent(new Event("atariupdate"));
		}
	}

	#debugOutput() {
        for (let i of this.#controller.Synth.Instruments)
            console.notice(console.stream.controller, `Instrument: ${i.Name}, Polyphony=${i.Polyphony}, Volume=${i.Volume}, Scale=${i.NoteList.Name}`);

        for (let i of this.#controller.Synth.Scales)
            console.notice(console.stream.controller, "Scale: " + i.Name);

		let i = this.#controller.Synth.ActiveInstrument;
        console.notice(console.stream.controller, `ACTIVE instrument: ${i.Name}, Polyphony=${i.Polyphony}, Volume=${i.Volume}, Scale=${i.NoteList.Name}`);
	}
}
