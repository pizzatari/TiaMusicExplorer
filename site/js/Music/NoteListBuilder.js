import { Music } from "./Music.js";
import { MusicScale, MusicNote } from "./Scales/MusicScale.js";
import { TIAScale, TIANote } from "./Scales/TIAScale.js";

// maps a key note to a group of similar notes
export class NoteGroup {
    #keyNote = null;
    #noteList = [];

    constructor(keyNote) {
        this.#keyNote = keyNote;
    }

    get KeyNote() { return this.#keyNote }
    get NoteList() { return this.#noteList }
    get BestNote() {
        if (this.#noteList.length > 0)
            return this.#noteList[0];
        return null;
    }
    get ListLength() {
        return this.#noteList.length;
    }

    addNote(note) {
        this.#noteList.push(note);
        this.sort();
    }

    addNoteList(noteList) {
        this.#noteList = this.#noteList.concat(noteList);
        this.sort();
    }

    sort() {
        this.#noteList.sort((a,b) => {
            let c = a.Frequency - b.Frequency;
            if (c != 0)
                return c;
            return Math.abs(a.Cents) - Math.abs(b.Cents);
        });
    }
}

// map = MicroId -> NoteGroup
export class NoteTable extends Map {
    #pivotNoteList = null;
    #noteLists = [];
    #matchedNotes = [];
    #unmatchedNotes = [];
    #pivotBounds = {
        firstMicroId:-1, lastMicroId:0,
        firstMidiNum:-1, lastMidiNum:0
    };
    #noteBounds = {
        firstMicroId:-1, lastMicroId:0,
        firstMidiNum:-1, lastMidiNum:0
    };

    constructor(pivotNoteList, noteList) {
        super();
        this.#pivotNoteList = pivotNoteList;

        for (let note of pivotNoteList)
            this.set(note.MicroId, new NoteGroup(note));

        this.#noteLists.push(noteList);
        this.joinList(noteList);
    }

    get PivotNoteList() { return this.#pivotNoteList }
    get PivotBounds() { return this.#pivotBounds }
    get NoteBounds() { return this.#noteBounds }

    joinList(noteList) {
        for (let n of noteList) {
            let note = n.clone(n);
            let group = this.get(note.MicroId);
            if (group !== undefined) {
                group.addNote(note);
                this.#matchedNotes.push(note);
                //this.#analyzer.addPair(group);
            } else {
                this.#unmatchedNotes.push(note);
            }

            if (this.#noteBounds.firstMicroId == -1 || note.MicroId < this.#noteBounds.firstMicroId)
                this.#noteBounds.firstMicroId = note.MicroId;

            if (note.MicroId > this.#noteBounds.lastMicroId)
                this.#noteBounds.lastMicroId = note.MicroId;

            if (this.#noteBounds.firstMidiNum == -1 || note.MidiNum < this.#noteBounds.firstMidiNum)
                this.#noteBounds.firstMidiNum = note.MidiNum;

            if (note.MidiNum > this.#noteBounds.lastMidiNum)
                this.#noteBounds.lastMidiNum = note.MidiNum;
        }
        return noteList;
    }

    getFlattenedTable() {
		let ary = [];

        for (let [key, group] of this) {
			let keyNote = group.KeyNote;
			let note = group.BestNote;

            // save a record of paired black notes
            if (ary.length > 0 && keyNote.IsBlack && note != null)
                ary[ary.length-1].TIASharpNote = note;

            let row = {
				MicroId: keyNote.MicroId,
				KeyNum: keyNote.KeyNum,
				MidiNum: keyNote.MidiNum,
				MicroDist: keyNote.MicroDist,
				Octave: keyNote.Octave,

				Key: keyNote.Key,
				KeyUp: keyNote.KeyUp,
				KeyDown: keyNote.KeyDown,
                //FlatKey: keyNote.FlatKey,
                //SharpKey: keyNote.SharpKey,

                IsWhite: keyNote.IsWhite,
                IsBlack: keyNote.IsBlack,
                Label: keyNote.Label,

            	Frequency: keyNote.Frequency,
            	FrequencyRounded: keyNote.getFrequencyRounded(),

            	TIAFrequency: note != null ? note.Frequency : '',
            	TIAFrequencyRounded: note != null ? note.getFrequencyRounded() : '',
				AUDC: note != null ? note.AUDC : '',
				AUDF: note != null ? note.AUDF : '',
				Cents: note != null ? note.Cents : '',
				CentsRounded: note != null ? note.getCentsRounded() : '',
				TIALabel: note != null ? note.AUDC + '/' + note.AUDF : '',


                KeyNote: keyNote,
                SharpKeyNote: keyNote.getSharpNote(),

                TIANote: note,
                TIASharpNote: null
			};
            ary.push(row);
        }

        return ary;
    }

}

export class NoteListBuilder {
    static getPianoNotes(music) {
        let scale = new MusicScale(music);
        return scale.getNoteList();
    }

    static getTIANotes(music, args) {
        let scale = new TIAScale(music, args);
        return scale.getNoteList();
    }

    static getNoteTable(pivotNoteList, noteList) {
        return new NoteTable(pivotNoteList, noteList);
    }
}
