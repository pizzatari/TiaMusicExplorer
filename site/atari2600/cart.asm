; -----------------------------------------------------------------------------
; Date:     May 9, 2023
; Version:  1.0
; Desc:     Skeleton cart used for setting video mode in Stella emulator.
; -----------------------------------------------------------------------------
    processor 6502

NO_ILLEGAL_OPCODES = 1

    IF VIDEO_MODE == 2

; PAL 50 Hz
VBLANK_LINES = (48-3)
KERNEL_LINES = 228
OVERSCAN_LINES = 36

    ELSE

; NTSC 60 Hz
VBLANK_LINES = (40-3)
KERNEL_LINES = 192
OVERSCAN_LINES = 30

    ENDIF

    include "include/vcs.h"
    include "include/macro.h"

    SEG.U ram
    ORG $80

Temp1 ds.b 1
Temp2 ds.b 1
SpritePtrs ds.b 12

    SEG rom
    ORG $f000

Reset
    CLEAN_START

    ; Wait for the timer to complete if we got here from reset button
    ; waiting prevents screen roll on pressing the game reset button.
.wait
    lda INTIM
    bne .wait

Frame
    ; vertical sync (3 lines)
    VERTICAL_SYNC

    ; Vertical blank
    lda #[VBLANK_LINES-2] * 76 / 64 + 1     ; convert lines to TIM64 cycles
    sta TIM64T

	lda #71
	ldx #0
	jsr HorizPosition

	lda #71+8
	ldx #1
	jsr HorizPosition

    sta WSYNC
	sta HMOVE

    lda #0
    sta REFP0
    sta REFP1
    sta ENAM0
    sta ENAM1

    lda #$4a
    sta COLUP0
    sta COLUP1

    lda #<VideoModeGfx0
    sta SpritePtrs
    lda #<VideoModeGfx1
    sta SpritePtrs+2
    lda #<VideoModeGfx2
    sta SpritePtrs+4
    lda #<VideoModeGfx3
    sta SpritePtrs+6
    lda #<VideoModeGfx4
    sta SpritePtrs+8
    lda #<VideoModeGfx5
    sta SpritePtrs+10

    lda #>VideoModeGfx0
    sta SpritePtrs+1
    lda #>VideoModeGfx1
    sta SpritePtrs+3
    lda #>VideoModeGfx2
    sta SpritePtrs+5
    lda #>VideoModeGfx3
    sta SpritePtrs+7
    lda #>VideoModeGfx4
    sta SpritePtrs+9
    lda #>VideoModeGfx5
    sta SpritePtrs+11

.vblank
    lda INTIM
    bne .vblank

    ; Kernel
    lda #0              ; disable latches, disable blanking
    sta WSYNC
    sta VBLANK
    sta COLUBK

    ldx #[KERNEL_LINES/2 - 1] - NTSCGraphic_HEIGHT
.top
    sta WSYNC
    lda INTIM
    ;sta COLUBK
    dex
    bne .top

    ldy #NTSCGraphic_HEIGHT-1
    jsr DrawGraphic
    
    ldx #KERNEL_LINES/2 - 1
    sta WSYNC
.bot
    lda INTIM
    ;sta COLUBK
    dex
    bne .bot
    
    ; Overscan
    lda #[OVERSCAN_LINES*76/64+1]     ; convert lines to TIM64 cycles
    sta TIM64T
    lda #%11000000      ; enable latches, enable blanking
    sta WSYNC
    sta VBLANK
    lda #0
    sta COLUBK
.overscan
    lda INTIM
    bne .overscan
    
    jmp Frame

    ORG $fa00

; Uses the NUSIZ and VDEL to draw a 48 pixel graphic.
; Y = height - 1
DrawGraphic SUBROUTINE
    ; set sprite options
    sty Temp1
    lda #%00000011          ; 3 sprites close
    sta NUSIZ0
    sta NUSIZ1
    sta VDELP0              ; vert. delay on
    sta VDELP1
    sta WSYNC

.Loop
    ;                        Cycles  Pixel    GRP0   GRP0A   GRP1   GRP1A
    ; --------------------------------------------------------------------
    ldy  Temp1              ; 3 (59) (177)
    lda  (SpritePtrs),y     ; 5 (64) (192)
    sta  GRP0               ; 3 (67) (201)     D1     --      --     --
    sta  WSYNC              ; 3 (75) (225)
    ; --------------------------------------------------------------------
    lda  (SpritePtrs+2),y   ; 5 (72)  (216)
    sta  GRP1               ; 3 (3)  (9)      D1     D1      D2     --
    lda  (SpritePtrs+4),y   ; 5 (8) (24)
    sta  GRP0               ; 3 (11) (33)      D3     D1      D2     D2
    lda  (SpritePtrs+6),y   ; 5 (16) (48)
    sta  Temp2              ; 3 (19) (57)
    lda  (SpritePtrs+8),y   ; 5 (24) (72)
    tax                     ; 2 (26) (78)
    lda  (SpritePtrs+10),y  ; 5 (31) (93)
    tay                     ; 2 (33) (99)
    lda  Temp2              ; 3 (36) (108)              !
    sta  GRP1               ; 3 (39) (117)     D3     D3      D4     D2!
    stx  GRP0               ; 3 (42) (126)     D5     D3!     D4     D4
    sty  GRP1               ; 3 (45) (135)     D5     D5      D6     D4!
    sta  GRP0               ; 3 (48) (144)     D4*    D5!     D6     D6
    dec  Temp1              ; 5 (53) (159)                             !
    bpl  .Loop              ; 3 (56) (168)

    lda #0
    sta GRP1
    sta GRP0
    sta GRP1
    rts


; -----------------------------------------------------------------------------
; Positions an object horizontally using the Battlezone algorithm.
; A = horizontal position
; X = object index: [0-4]

; 0 = Player 0
; 1 = Player 1
; 4 = Missile 0
; 5 = Missile 1
; 5 = Ball
;
;           Follow up with:
; -----------------------------------------------------------------------------
HorizPosition SUBROUTINE
    sec             ; 2 (2)
    sta WSYNC       ; 3 (5)

    ; coarse position timing
.Div15
    sbc #15         ; 2 (2)
    bcs .Div15      ; 3 (5)

    ; computing fine positioning value
    eor #7          ; 2 (11)            ; 4 bit signed subtraction
    asl             ; 2 (13)
    asl             ; 2 (15)
    asl             ; 2 (17)
    asl             ; 2 (19)

    ; position
    sta RESP0,X     ; 4 (23)            ; coarse position
    sta HMP0,X      ; 4 (27)            ; fine position
    rts             ; 6 (6)

    ORG $fb00

BlankSprite
    ds.b 32, 0

    include "graphics.sp"

    IF VIDEO_MODE == 2
VideoModeGfx  = PALGraphic
VideoModeGfx0 = PALGraphic0
VideoModeGfx1 = PALGraphic1
VideoModeGfx2 = PALGraphic2
VideoModeGfx3 = PALGraphic3
VideoModeGfx4 = PALGraphic4
VideoModeGfx5 = PALGraphic5
    ELSE
VideoModeGfx  = NTSCGraphic
VideoModeGfx0 = NTSCGraphic0
VideoModeGfx1 = NTSCGraphic1
VideoModeGfx2 = NTSCGraphic2
VideoModeGfx3 = NTSCGraphic3
VideoModeGfx4 = NTSCGraphic4
VideoModeGfx5 = NTSCGraphic5
    ENDIF

    ORG $fffa
Interrupts
    .word Reset   ; NMI
    .word Reset   ; RESET
    .word Reset   ; IRQ
