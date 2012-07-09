alpha-sandbox
=============

Files for [alpha.malariagen.net/sandbox/](http://alpha.malariagen.net/sandbox/).

All files should carry the following health warning:

    <strong>WARNING: Everything on <a href="http://alpha.malariagen.net/">alpha.malariagen.net</a> is an experimental prototype. Web applications may be broken and data may be wrong. Use at your own risk.</strong>

CGI scripts must be given executable permission (`chmod +x`) or they won't run.

Please test any server-side CGI or WSGI scripts locally before pushing to 
this repository. You can test locally by adding the following directives to your 
Apache configuration:

	WSGIDaemonProcess default processes=2 threads=10
	WSGIProcessGroup default
	WSGIApplicationGroup %{RESOURCE}
	WSGIScriptReloading On
	
	Alias /sandbox/ /path/to/local/git/malariagen/alpha-sandbox/
	<Directory "/path/to/local/git/malariagen/alpha-sandbox/">
		Options Indexes FollowSymLinks MultiViews ExecCGI
		MultiviewsMatch Handlers
		AddHandler wsgi-script .wsgi .py
		AddHandler cgi-script .cgi .pl
		AllowOverride All
		Order allow,deny
		allow from all         
	</Directory>

To get the Python examples running you will need mod_wsgi, Bottle, Flask and HTSQL 
installed, e.g.: 

	sudo apt-get install libapache2-mod-wsgi 
	sudo apt-get install python-pip
	sudo pip install bottle flask htsql
	
Do not commit any large files (more than a few MB) to this repository.