; Compiles the production path include with electron-builder's actual assisted
; directory/instfiles pages. This fixture has no payload or installation actions.
Unicode true
Name "SpecFlow directory test (no installation)"
OutFile "${TEST_EXE}"
RequestExecutionLevel user
AutoCloseWindow true
ShowInstDetails show

!include "MUI2.nsh"
!include "${TEST_INCLUDE}"

!define INSTALL_MODE_PER_ALL_USERS
!define allowToChangeInstallationDirectory
!define APP_FILENAME "specflow"
!define HIDE_RUN_AFTER_FINISH
; This fixture always shows the directory page, including during repeat runs.
!macro skipPageIfUpdated
!macroend
!include "${TEST_ASSISTED}"
!insertmacro MUI_LANGUAGE "English"

Var ReportHandle
Var Failures
Var SelectedDirectory

Function .onInit
  ${If} $INSTDIR == ""
    StrCpy $INSTDIR "$LOCALAPPDATA\Programs\specflow"
  ${EndIf}
  !insertmacro customInit
FunctionEnd

!macro CheckPath LABEL INPUT EXPECTED
  StrCpy $INSTDIR "${INPUT}"
  StrCpy $0 "preserve register 0"
  StrCpy $1 "preserve register 1"
  Call SpecFlowNormalizeInstallDirectory
  ${If} $INSTDIR == "${EXPECTED}"
  ${AndIf} $0 == "preserve register 0"
  ${AndIf} $1 == "preserve register 1"
    ; Calling the same production function twice must not add another directory.
    Call SpecFlowNormalizeInstallDirectory
    ${If} $INSTDIR == "${EXPECTED}"
      FileWriteUTF16LE $ReportHandle "PASS$\t${LABEL}$\t$INSTDIR$\r$\n"
    ${Else}
      IntOp $Failures $Failures + 1
      FileWriteUTF16LE $ReportHandle "FAIL idempotence$\t${LABEL}$\t$INSTDIR$\r$\n"
    ${EndIf}
  ${Else}
    IntOp $Failures $Failures + 1
    FileWriteUTF16LE $ReportHandle "FAIL path or registers$\t${LABEL}$\t$INSTDIR$\r$\n"
  ${EndIf}
!macroend

Section
  ; All writes stay in the dedicated test output directory. $INSTDIR is used
  ; only as an in-memory input; no directories, registry keys or shortcuts change.
  FileOpen $ReportHandle "${TEST_REPORT}" w
  StrCpy $SelectedDirectory $INSTDIR
  FileWriteUTF16LE /BOM $ReportHandle "SELECTED$\t$INSTDIR$\r$\n"
  StrCpy $Failures 0
  !include "${TEST_CASES}"
  StrCpy $INSTDIR $SelectedDirectory
  FileClose $ReportHandle
  SetErrorLevel $Failures
SectionEnd
