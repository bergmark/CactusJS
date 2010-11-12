#
# Copyright (c) 2007-2008, Adam Bergmark
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are met:
#     * Redistributions of source code must retain the above copyright
#       notice, this list of conditions and the following disclaimer.
#     * Redistributions in binary form must reproduce the above copyright
#       notice, this list of conditions and the following disclaimer in the
#       documentation and/or other materials provided with the distribution.
#     * Neither the name of Cactus JS nor the
#       names of its contributors may be used to endorse or promote products
#       derived from this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY Adam Bergmark ``AS IS'' AND ANY
# EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
# WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL Adam Bergmark BE LIABLE FOR ANY
# DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
# (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
# LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
# ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
# SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
#

#
# @file
# Builds a dependency tree of all files.
#

class NonExistantDependency < Exception
end

class FileDependency
  def self.path_to_js_path(path)
    path.sub('trunk/', '').sub('.js', '').gsub('/', '.').sub('UT-', '')
  end
  def self.js_path_to_path(js_path)
    path = 'trunk/' + js_path.gsub('.', '/')

    # If a package then no .js suffix.
    if File.exists?(path)
      return path
    end

    if path =~ %r{(trunk/UnitTest/(?:.+?/)?)([^/]+)$}
      path = $1 + 'UT-' + $2
    end

    path + '.js'
  end

  def initialize(js_path)
    @@js_files << self
    @js_path = js_path
    @path = FileDependency.js_path_to_path(js_path)
    @was_read = false
    @dependencies = []
    @taken = false

    unless File.exists?(@path)
      raise NonExistantDependency.new("File not found: #{@path}")
    end

    unless package?
      read
    end
  end

 private

  def read
    return if @was_read
    @was_read = true
    File.read(@path).scan(/Cactus\.([A-Za-z\d_.]+)/) do |(js_path,)|
      begin
        dependency = FileDependency.find(js_path)
        @dependencies << dependency unless self == dependency
      rescue NonExistantDependency
        puts "#{@js_path} lacks dependency: #{js_path}"
      end
    end
  end

 public

  attr_reader :was_read, :path, :js_path

  def dependencies
    @dependencies.reject { |d| d.taken? or d.package? }
  end

  def taken?
    @taken
  end
  def taken=(t)
    @taken = !!t
  end

  def package?
    File.directory? @path
  end

  @@js_files = []

  def self.clear
    @@js_files = []
  end

  def self.find(js_path)
    @@js_files.each do |jsf|
      if jsf.js_path == js_path
        return jsf
      end
    end

    FileDependency.new js_path
  end

  def self.find_all
    @@js_files
  end

  def self.find_all_files
    self.find_all.reject { |jsf| jsf.package? }
  end

  def self.find_standalone
    self.find_all_files.select do |jsf|
      jsf.dependencies.size.zero? and not jsf.taken?
    end
  end

  def self.remaining
    self.find_all_files.reject { |jsf| jsf.taken? }
  end

  def no_dependencies?
    self.dependencies.size.zero?
  end

  def self.all_taken?
    self.find_all_files.all? { |jsf| jsf.taken? }
  end

end
