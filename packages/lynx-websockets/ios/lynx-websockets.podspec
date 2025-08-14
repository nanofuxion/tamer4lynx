require "json"

# Read package.json to get metadata
package = JSON.parse(File.read(File.join(__dir__, "..", "package.json")))
author_string = package["author"]

# Use regex to parse the author string: "Name <email> (url)"
author_match = author_string.match(/(?<name>.*) <(?<email>.*)> \((?<url>.*)\)/)

# Set the author and homepage using the captured groups from the regex
# If the regex doesn't match, provide sensible fallbacks.
author_name = author_match ? author_match[:name] : "Unknown"
author_email = author_match ? author_match[:email] : ""
homepage_url = author_match ? author_match[:url] : "https://github.com"

Pod::Spec.new do |s|
  s.name         = "lynx-websockets"
  s.version      = package["version"]
  s.summary      = package["description"]
  
  # --- Dynamically Parsed Fields ---
  s.homepage     = homepage_url
  s.authors      = { author_name => author_email }
  # ---------------------------------
  
  s.license      = package["license"]
  s.source       = { :path => '.' }
  s.platforms    = { :ios => "12.0" }
  
  s.source_files  = "ios/**/*.swift"

  s.dependency "Lynx"
end