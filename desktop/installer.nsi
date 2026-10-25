; Basic Pathshala - NMMS : Windows installer (per-user, no admin rights needed)
Unicode true
!include "MUI2.nsh"

!define APPNAME "Basic Pathshala NMMS"
!define APPEXE "Basic Pathshala NMMS.exe"
!define COMPANY "Basic Pathshala"
!ifndef VERSION
  !define VERSION "1.0.0"
!endif
!ifndef SRCDIR
  !define SRCDIR "out\Basic Pathshala NMMS-win32-x64"
!endif

Name "Basic Pathshala - NMMS"
OutFile "out\BasicPathshala-NMMS-Setup-${VERSION}.exe"
InstallDir "$LOCALAPPDATA\Programs\BasicPathshalaNMMS"
InstallDirRegKey HKCU "Software\BasicPathshalaNMMS" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID lzma
BrandingText "© Basic Pathshala | Concept & Development: Subodh Maurya"

VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "Basic Pathshala - NMMS"
VIAddVersionKey "CompanyName" "${COMPANY}"
VIAddVersionKey "LegalCopyright" "© Basic Pathshala — Subodh Maurya"
VIAddVersionKey "FileDescription" "Basic Pathshala - NMMS Setup"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"

!define MUI_ICON "icon.ico"
!define MUI_UNICON "icon.ico"
!define MUI_WELCOMEFINISHPAGE_BITMAP "installer-side.bmp"
!define MUI_UNWELCOMEFINISHPAGE_BITMAP "installer-side.bmp"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "installer-header.bmp"
!define MUI_HEADERIMAGE_RIGHT
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "Basic Pathshala - NMMS"
!define MUI_WELCOMEPAGE_TEXT "UP NMMS के लिए पेपर, PPT, Google Form, OMR और मॉक टेस्ट।$\r$\n$\r$\nUP NMMS papers, PPT, Google Form, OMR and mock tests.$\r$\n$\r$\nConcept & Development: Subodh Maurya$\r$\n$\r$\nआगे बढ़ने के लिए Next दबाएँ।"
!define MUI_FINISHPAGE_RUN "$INSTDIR\${APPEXE}"
!define MUI_FINISHPAGE_RUN_TEXT "Basic Pathshala - NMMS अभी खोलें"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Section "Install"
  ; close a running copy so files can be replaced on upgrade
  nsExec::Exec 'taskkill /F /IM "${APPEXE}"'
  SetOutPath "$INSTDIR"
  File /r "${SRCDIR}\*.*"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\Basic Pathshala"
  CreateShortcut "$SMPROGRAMS\Basic Pathshala\Basic Pathshala - NMMS.lnk" "$INSTDIR\${APPEXE}" "" "$INSTDIR\${APPEXE}" 0
  CreateShortcut "$SMPROGRAMS\Basic Pathshala\Uninstall Basic Pathshala - NMMS.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\Basic Pathshala - NMMS.lnk" "$INSTDIR\${APPEXE}" "" "$INSTDIR\${APPEXE}" 0
  WriteRegStr HKCU "Software\BasicPathshalaNMMS" "InstallDir" "$INSTDIR"
  !define UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\BasicPathshalaNMMS"
  WriteRegStr HKCU "${UNINST}" "DisplayName" "Basic Pathshala - NMMS"
  WriteRegStr HKCU "${UNINST}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINST}" "Publisher" "Basic Pathshala (Subodh Maurya)"
  WriteRegStr HKCU "${UNINST}" "DisplayIcon" "$INSTDIR\${APPEXE}"
  WriteRegStr HKCU "${UNINST}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${UNINST}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINST}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  nsExec::Exec 'taskkill /F /IM "${APPEXE}"'
  Delete "$DESKTOP\Basic Pathshala - NMMS.lnk"
  RMDir /r "$SMPROGRAMS\Basic Pathshala"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\BasicPathshalaNMMS"
  DeleteRegKey HKCU "Software\BasicPathshalaNMMS"
  ; user data (questions, papers, results) in %APPDATA% is kept on purpose
SectionEnd
