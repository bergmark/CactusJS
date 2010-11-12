load 'scripts/file_dependency/file_dependency.rb'

files = `find trunk -name "*.js" | grep -v trunk/UnitTest/ | grep -v trunk/test/`.split

files.each do |path|
  FileDependency.find(FileDependency.path_to_js_path(path))
end

ordered = []

base = FileDependency.find('Base')
base.taken = true
ordered << base

until FileDependency.find_standalone.size.zero?
  FileDependency.find_standalone.each do |jsf|
    jsf.taken = true
    ordered << jsf
  end
end

ordered.each { |jsf| puts jsf.path }



