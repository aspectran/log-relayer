@echo off
rem Detect JAVA_HOME environment variable
if not defined JAVA_HOME goto java-not-set

set BASE_DIR=%~dp0..
if not defined JAVA_OPTS (
    set JAVA_OPTS=-Xms256m -Xmx1024m
)
if not defined LOGGING_CONFIG (
    set LOGGING_CONFIG=%BASE_DIR%\config\logback.xml
)
set TMP_DIR=%BASE_DIR%\temp
set ASPECTRAN_CONFIG=%BASE_DIR%\config\aspectran-config.apon

"%JAVA_HOME%\bin\java.exe" ^
    %JAVA_OPTS% ^
    -classpath "%BASE_DIR%\lib\*" ^
    -Djava.io.tmpdir="%TMP_DIR%" ^
    -Djava.awt.headless=true ^
    -Djava.net.preferIPv4Stack=true ^
    -Dlogback.configurationFile="%LOGGING_CONFIG%" ^
    -Daspectran.basePath="%BASE_DIR%" ^
    %ASPECTRAN_OPTS% ^
    com.aspectran.daemon.DefaultDaemon ^
    "%ASPECTRAN_CONFIG%"
goto end

:java-not-set
echo JAVA_HOME environment variable missing. Please set it before using the script.
goto end

:end