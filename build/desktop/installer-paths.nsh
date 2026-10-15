!include "FileFunc.nsh"
!include "LogicLib.nsh"
!include "WinMessages.nsh"

!ifndef BUILD_UNINSTALLER
  ; The directory page must allow a root selection to reach our pre-install
  ; callback. No application files are written until it becomes root\specflow.
  AllowRootDirInstall true
  Var SpecFlowUpdatingDirectory

  Function SpecFlowNormalizeInstallDirectory
    Push $0
    Push $1
    ; NSIS strips the final separator from $INSTDIR, including C:\ -> C:.
    ; Check that form before GetFullPathName can treat it as drive-relative.
    ${GetRoot} "$INSTDIR" $1
    ${If} $1 != ""
      ${If} $INSTDIR == "$1"
      ${OrIf} $INSTDIR == "$1\"
        StrCpy $INSTDIR "$1\specflow"
      ${Else}
        ; Recognize equivalent root paths, preserving every other selection.
        GetFullPathName $0 "$INSTDIR"
        ${If} $0 == "$1"
        ${OrIf} $0 == "$1\"
          StrCpy $INSTDIR "$1\specflow"
        ${EndIf}
      ${EndIf}
    ${EndIf}
    Pop $1
    Pop $0
  FunctionEnd

  Function .onVerifyInstDir
    Push $0
    Push $1
    Push $2
    Push $3
    ${If} $SpecFlowUpdatingDirectory != "1"
      ; The folder browser also verifies highlighted tree items before OK.
      ; Wait until it closes so Cancel keeps the original destination intact.
      System::Call 'user32::GetActiveWindow() p.r0'
      ${If} $0 == $HWNDPARENT
        FindWindow $0 "#32770" "" $HWNDPARENT
        GetDlgItem $1 $0 1019
        ${If} $1 != 0
          StrCpy $2 "$INSTDIR"
          Call SpecFlowNormalizeInstallDirectory
          ${If} $INSTDIR != $2
            ; Show the real destination immediately, including Browse selections.
            StrCpy $SpecFlowUpdatingDirectory "1"
            SendMessage $1 ${WM_SETTEXT} 0 "STR:$INSTDIR"
            System::Call 'user32::GetFocus() p.r0'
            ${If} $0 == $1
              ; Selecting only the added suffix lets someone typing H:\Apps
              ; continue typing normally, replacing the suggested folder name.
              ${GetRoot} "$INSTDIR" $3
              StrLen $3 $3
              IntOp $3 $3 + 1
              SendMessage $1 ${EM_SETSEL} $3 -1
            ${EndIf}
            StrCpy $SpecFlowUpdatingDirectory "0"
          ${EndIf}
        ${EndIf}
      ${EndIf}
    ${EndIf}
    Pop $3
    Pop $2
    Pop $1
    Pop $0
  FunctionEnd

  !macro customInit
    ; Silent /D= installations skip page callbacks.
    Call SpecFlowNormalizeInstallDirectory
    ; Keep the replaced builder callback linked without executing it. Otherwise
    ; NSIS reports unused function 6010 and electron-builder's -WX rejects it.
    Push $0
    GetFunctionAddress $0 instFilesPre
    Pop $0
  !macroend

  !macro customPageAfterChangeDir
    ; electron-builder 26 appends the app name to ALL directories not containing
    ; it. Replace that instfiles-pre callback after the directory page commits
    ; $INSTDIR, before any files, shortcuts or uninstall information are written.
    !undef MUI_PAGE_CUSTOMFUNCTION_PRE
    !define MUI_PAGE_CUSTOMFUNCTION_PRE SpecFlowNormalizeInstallDirectory
  !macroend
!endif
