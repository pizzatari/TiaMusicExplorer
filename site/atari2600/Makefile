ASM			= dasm
FIND		= find
CHMOD		= chmod 
MKDIR		= mkdir
RMDIR		= rmdir
PERL		= perl
MAKE_SPRITE = ./make-big-sprite

ASM_FLAGS   = -v0 -f3

TMP_DIR		= .

# 1=ntsc, 2=pal
VIDEO_MODE  = 1

.PHONY: all
all: $(TMP_DIR) NTSC.bin PAL.bin

$(TMP_DIR):
	$(MKDIR) $(TMP_DIR)

NTSC.bin PAL.bin: include/vcs.h include/macro.h graphics.sp cart.asm
	$(ASM) cart.asm $(ASM_FLAGS) -l$(TMP_DIR)/NTSC.lst -s$(TMP_DIR)/NTSC.sym -oNTSC.bin -DVIDEO_MODE=1
	$(ASM) cart.asm $(ASM_FLAGS) -l$(TMP_DIR)/PAL.lst -s$(TMP_DIR)/PAL.sym -oPAL.bin -DVIDEO_MODE=2
	$(CHMOD) ug+x *.bin

%.sp: %.sprite $<
	echo $(PERL) $(MAKE_SPRITE) "$<" -o"$@" -H1
	$(PERL) $(MAKE_SPRITE) "$<" -o"$@" -H1

.PHONY: clean
clean:
	find . \( -iname '*.bin' -or -iname '*.lst' -or -iname '*.sym' -or -name '*.exe' -or -name '*.sp' \) -exec rm -fv {} +
