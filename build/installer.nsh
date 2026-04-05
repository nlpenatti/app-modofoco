!macro customInstall
  DeleteRegKey HKCU "Software\ModoFoco"
  WriteRegStr HKCU "Software\ModoFoco" "NovaInstalacao" "1"
!macroend