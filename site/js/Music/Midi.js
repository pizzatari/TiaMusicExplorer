const NUM_KEYS = 128;
const NUM_CONTROLS = 128;

const SUSTAIN = 64;
const VOLUME_CC = 7;
const VOLUME2_CC = 9;
const EXPRESSION_CC = 1;

export const MidiStatus = {
    NOTE_OFF: 0x8,
    NOTE_ON: 0x9,
    CONTROL_CHANGE: 0xb
};

export const MidiCC = {
    EXPRESSION: 1,
    VOLUME: 7,
    ALESIS_VOLUME: 9,
    SUSTAIN: 64
};

export class MidiParser {
    #isNote = false;
    #isControl = false;

    #noteOn = false;
    #noteOff = false;
    #midiNum = 0;
    #velocity = 0;

    #controlKey = 0;
    #value = 0;

    #sustainOn = false;
    #sustainOff = false;

    #controlsEnabled = [ MidiCC.EXPRESSION, MidiCC.SUSTAIN, MidiCC.VOLUME, MidiCC.ALESIS_VOLUME ];

    constructor() { }

    get IsNote() { return this.#isNote }
    get IsControl() { return this.#isControl }

    get MidiNum() { return this.#midiNum }
    get NoteOn() { return this.#noteOn }
    get NoteOff() { return this.#noteOff }
    get Velocity() { return parseInt(this.#velocity) }

    get ControlsEnabled() { return this.#controlsEnabled }
    get ControlKey() { return this.#controlKey }
    get Value() { return parseInt(this.#value) }

    get SustainOn() { return this.#sustainOn }
    get SustainOff() { return this.#sustainOff }

    set ControlsEnabled(ccAry) {
        this.#controlsEnabled = [];

        let ccList = Object.values(MidiCC);

        for (let c of ccAry) {
            if (c in ccList)
                this.#controlsEnabled.push(c);
        }
    }

    parse(message) {
        let status = message[0] >> 4;
        let channel = message[0] & 0xf;
        let data1 = message[1];
        let data2 = message[2];

        if (data1 > 127 || data2 > 127)
            return;

        this.#clear();

        if (status == MidiStatus.NOTE_ON && data2 > 0)
        {
            this.#isNote = true;
            this.#midiNum = data1;
            this.#noteOn = true;

        } else if (status == MidiStatus.NOTE_OFF || (status == MidiStatus.NOTE_ON && data2 == 0)) {
            this.#isNote = true;
            this.#midiNum = data1;
            this.#noteOff = true;

        } else if (status == MidiStatus.CONTROL_CHANGE) {
            this.#isControl = true;
            this.#controlKey = data1;

            if (data1 == MidiCC.SUSTAIN) {
                if (data2 >= 64) {
                    this.#sustainOn = true;
                }
            }

        } else {
            console.log(`Unhandled key ${data1} (raw message=${message})`);
        }

        this.#value = data2;
        this.#velocity = data2;
    }

    #clear() {
        this.#isNote = false;
        this.#isControl = false;

        this.#midiNum = 0;
        this.#noteOn = false;
        this.#noteOff = false;
        this.#velocity = 0;

        this.#controlKey = 0;
        this.#value = 0;

        this.#sustainOn = false;
        this.#sustainOff = false;
    }
}

/*
export class Midi {
    #midiAccess = null;
    #midiInputs = [];
    #midiOutputs = [];
    #statusMsgs = [];
    #state = 'unintialized';
    #reason = null;

    #midiParser = null;

    get Inputs() { return this.#midiInputs }
    get Outputs() { return this.#midiOutputs }
    get State() { return this.#state }
    get StatusMessages() { return this.#statusMsgs }
    get Reason() { return this.#reason }
    get Parser() { 

    constructor(doneHandler = null) {
        console.log("Midi.js: Connecting to MIDI");

        let midiOpts = {software:true};

        navigator.requestMIDIAccess(midiOpts).then(
            function(midiAccess) {
                this.#midiAccess = midiAccess;
                this.#state = 'connected';
                console.log("Midi.js: Midi driver connected");

                if (doneHandler != null)
                    doneHandler();

/-
                if (this.#midiAccess.inputs.size > 0) {
                    for (let entry of midiAccess.inputs) {
                        this.#midiInputs.push(entry[1]);
                        console.log("Midi.js: Found MIDI input device: " + entry[1].name);
                    }
                }

                if (this.#midiAccess.outputs.size > 0) {
                    for (let entry of midiAccess.outputs) {
                        this.#midiOutputs.push(entry[1]);
                        console.log("Midi.js: Found MIDI output device: " + entry[1].name);
                    }
                }

                if (this.#midiInputs.length == 0)
                    this.#statusMsgs.push('Midi initialized successfully, but no input keyboards were found. Plug in a Midi keyboard 🎹 to play live.');
-/

            },
            function(reason) {
                this.#reason = reason;
                this.#state = 'error';
                this.#statusMsgs.push(
                    'Midi API failed to initialize. ' +
                    'It is blocked by your settings or it may be unsupported by this browser.'
                );

                if (doneHandler != null)
                    doneHandler();
            }
        );
        console.log("Midi.js: Waiting on MIDI");
    }
}
*/
