import { Synth } from "../Music/Synth.js"
import { MidiParser } from "../MUsic/Midi.js"

export class PageController {
    #opts = null;
    #synth = null;
    #pageUI = null;
    #midi = null;
	#midiParser = null;

    constructor(opts, pageUI) {
        this.#opts = opts;
        this.#pageUI = pageUI;
    }

	addSynth(s) {
		this.#synth = s;
        this.#setPiano1Handlers();
        this.#setPiano2Handlers();
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

	#refreshMidiPorts() {
		console.log("Found " + this.#midi.inputs.size + " midi inputs");
		this.#pageUI.clearMidiLists();
		for (let [id, input] of this.#midi.inputs) {
			this.#pageUI.addMidiInput(input.id, input.name, input.manufacturer, input.version);
		}
	}

    #setPiano1Handlers() {
		let piano = this.#pageUI.HorizontalKeys;

        // div.piano > div > span
    	for (var i=0; i < piano.childNodes.length; i++) {
            let key = piano.childNodes[i].childNodes[0];

            if (typeof key != 'undefined') {
                let midiNum = key.getAttribute('midinum');
                let microDist = key.getAttribute('microDist');

                key.addEventListener("mousedown", (e) => {
                    if (e.buttons & 1) {
                        this.#synth.ActiveInstrument.noteOn(midiNum, microDist);
						this.#pageUI.updateKeyStatus(midiNum, microDist, 'on');
                    }
                });
                key.addEventListener("mouseenter", (e) => {
                    if (e.buttons & 1) {
                        this.#synth.ActiveInstrument.noteOn(midiNum, microDist);
						this.#pageUI.updateKeyStatus(midiNum, microDist, 'on');
                    }
                });
                key.addEventListener("mouseup", (e) => {
                    this.#synth.ActiveInstrument.noteOff(midiNum, microDist);
					this.#pageUI.updateKeyStatus(midiNum, microDist, 'off');
                });
                key.addEventListener("mouseleave", (e) => {
                    this.#synth.ActiveInstrument.noteOff(midiNum, microDist);
					this.#pageUI.updateKeyStatus(midiNum, microDist, 'off');
                });
            } else {
                console.log("setPiano1Handlers: key undefined");
            }
    	}
    }

    #setPiano2Handlers() {
		let table = this.#pageUI.VerticalKeys;

        // table.piano > tr > td > span
        // i=1 to skip TR/TH header row
    	for (let i=1; i < table.rows.length; i++) {
            for (let j=0; j < Math.min(table.rows.length, 2); j++) {
                let key = table.rows[i].cells[0].childNodes[j];

                if (typeof key != 'undefined') {
                    let midiNum = key.getAttribute('midinum');
                    let microDist = key.getAttribute('microDist');

                    key.addEventListener("mousedown", (e) => {
                        if (e.buttons & 1) {
                            this.#synth.ActiveInstrument.noteOn(midiNum, microDist);
							this.#pageUI.updateKeyStatus(midiNum, microDist, 'on');
                        }
                    });
                    key.addEventListener("mouseenter", (e) => {
                        if (e.buttons & 1) {
                            this.#synth.ActiveInstrument.noteOn(midiNum, microDist);
							this.#pageUI.updateKeyStatus(midiNum, microDist, 'on');
                        }
                    });
                    key.addEventListener("mouseup", (e) => {
                        this.#synth.ActiveInstrument.noteOff(midiNum, microDist);
						this.#pageUI.updateKeyStatus(midiNum, microDist, 'off');
                    });
                    key.addEventListener("mouseleave", (e) => {
                        this.#synth.ActiveInstrument.noteOff(midiNum, microDist);
						this.#pageUI.updateKeyStatus(midiNum, microDist, 'off');
                    });
                } else {
                    console.log("setPiano2Handlers: key undefined");
                }
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

function midiMessageHandler() {
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
