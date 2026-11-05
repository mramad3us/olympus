@echo off
rem OLYMPUS on Windows: serve the game and open the browser. See tools\play.ps1.
rem   play.cmd            the play copy (a release) on :8200
rem   play.cmd --dev      the working tree on :8201
rem   play.cmd --promote [vX.Y.Z]   move the play copy to a release, then play
rem   play.cmd --status   where the play copy is
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\play.ps1" %*
if errorlevel 1 pause
