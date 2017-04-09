/** @jsx React.DOM */

var Book = React.createClass({
	getInitialState: function() {
		return {book: {}, contents: [], paginated: [], read: [], user: {}};
	},
	initializeContent: function() {
    var self = this;
    atomic.get(self.props.url)
    .success(function (data, xhr) {
      self.setState({book: data.book});
		  self.registerContent(data.contents);
			self.discoverContent(_.last(self.state.contents).id);
    })
    .error(function (data, xhr) {});
	},
	addReads: function(new_contents) {
		var new_reads = _.map(new_contents, function(apu) { return apu.id });
		var read_state = this.state.read;
		var reads = _.uniq(read_state.concat(new_reads));
		return reads;
	},
	addContent: function(new_contents) {
		var content_state = this.state.contents || [];
		var new_ids = _.map(new_contents, function(apu) { return apu.id });
		var filtered_state = _.reject(content_state, function(apu) { return _.contains(new_ids, apu.id) });
		var unsorted_contents = filtered_state.concat(new_contents);
		var sorted_contents = _.sortBy(unsorted_contents, function(apu){ return apu.position; });
		return sorted_contents;
	},
	registerContent: function(new_contents) {
		var contents = this.addContent(new_contents);
		var reads = this.addReads(new_contents);
		this.setState({
			contents: contents,
			read: reads,
			paginated: this.paginator(contents)
		});
	},
	forward: function(apu_id, callback) {
		$.ajax({
			url: ("/api/discover/" + apu_id),
			success: function(data) {
				var reads = this.addReads(data.contents);
				callback(data, reads);
			}.bind(this)
		});
	},
	range: function(parent_id, child_id, direction, callback) {
    atomic.post(('/apu/range/' + direction), {parent_id: parent_id, child_id: child_id})
    .success(function (data, xhr) {
      callback(data);
    })
    .error(function (data, xhr) {});
	},
	chapters: function(location_id, callback) {
    var self = this;
    atomic.post(('/apu/chapters/' + location_id), {location_id: location_id})
    .success(function (data, xhr) {
      var reads = self.addReads(data.contents);
      callback(data, reads);
    })
    .error(function (data, xhr) {});
	},
	discoverContent: function(parent_id, callback) {
		this.forward(parent_id, function(data, reads) {
			if (data.contents.length > 1) {
				var contents = this.state.contents.concat(_.rest(data.contents));
				this.setState({contents: contents, read: reads, paginated: this.paginator(contents)});
			} else {
				if (_.isFunction(callback)) {
					callback(data.contents);
				}
			}
		}.bind(this))
	},
	rangeContent: function(parent_id, child_id, direction, callback) {
		this.range(parent_id, child_id, direction, function(data) {
			this.registerContent(data.contents);
			if (_.isFunction(callback)) { callback(data.contents); }
		}.bind(this))
	},
	getChapter: function(parent_id, child_id, direction, callback) {
		this.range(parent_id, child_id, direction, function(data) {
			var contents = data.contents;
			var child = _.find(this.state.contents, function(apu) { return (apu.id === child_id); });
			if (child) {
				if (_.contains(child.labels, "Stub")) { _.last(contents).labels.push("Stub"); };
			};
			this.registerContent(contents);
			if (_.isFunction(callback)) { callback(contents); }
		}.bind(this))
	},
	previousChapters: function(apu) {
		var apu_id = apu.id;
		this.chapters(apu_id, function(data, reads) {
			var contents = data.contents;
			var last_return = _.last(contents);
			var last_state = _.find(this.state.contents, function(apu) { return (apu.id === last_return.id); });
			if (last_state) {
				if (!_.contains(last_state.labels, "Stub")) {
					var i = _.last(contents).labels.indexOf("Stub");
					if (i != -1) { _.last(contents).labels.splice(i, 1) };
				};
			};
			this.registerContent(contents);
		}.bind(this))
	},
	appendContent: function(apu) {
		var contents = _.filter(this.state.contents, function(content) { return content.position < apu.position });
		if (!_.isEmpty(apu.siblings)) {
			var family = apu.siblings.concat([apu.id]);
			var previous_reads = _.intersection(this.state.read, family);
			var current_index = _.indexOf(previous_reads, apu.id);
			var next_id;
			if (_.last(previous_reads) == apu.id) {
				next_id = _.sample(_.difference(apu.siblings, this.state.read));
			} else {
				next_id = previous_reads[(current_index + 1)];
			};
			this.forward(next_id, function(data, reads) {
				if (!_.isEmpty(data.contents)) {
					update = contents.concat(data.contents);
					this.setState({contents: update, read: reads, paginated: this.paginator(update)});
				}
			}.bind(this))
		}
	},
	previousContent: function(apu) {
		var contents = _.filter(this.state.contents, function(content) { return content.position < apu.position });
		if (!_.isEmpty(_.intersection(apu.siblings, this.state.read))) {
			var family = apu.siblings.concat([apu.id]);
			var previous_reads = _.intersection(this.state.read, family);
			var current_index = _.indexOf(previous_reads, apu.id);
			var next_id = previous_reads[(current_index - 1)];
			this.forward(next_id, function(data, reads) {
				if (!_.isEmpty(data.contents)) {
					update = contents.concat(data.contents);
					this.setState({contents: update, read: reads, paginated: this.paginator(update)});
				}
			}.bind(this))
		}
	},
	restorePagination: function() {
		this.setState({paginated: this.paginator(this.state.contents)});
	},
	trimPagination: function(apu) {
		var contents = _.filter(this.state.contents, function(content) { return content.position < apu.position });
		this.setState({paginated: this.paginator(contents)});
	},
	loggedIn: function() {
		return (_.isEmpty(this.state.user) ? false : true);
	},
	componentWillMount: function() {
		this.initializeContent();
	},
	accessRead: function() {
		return this.state.read;
	},
	addAPU: function(apu, payload, type, callback) {
		$.ajax({
			type: "POST",
			url: '/' + type + '/new',
			data: payload,
			success: function(data) {
				//alert(JSON.stringify(_.last(data.contents), null, '  '));
				var contents = _.filter(this.state.contents, function(content) { return content.position < apu.position });
				contents.push(_.first(data.contents));
				var reads = this.state.read;
				reads.push(_.first(data.contents).id);
				this.setState({contents: contents, read: reads, paginated: this.paginator(contents, {authored: true})});
				callback(data.contents);
			}.bind(this)
		});
	},
	register: function(name) {
		$.ajax({
			type: "POST",
			url: '/user/name',
			data: {name: name, id: this.state.user.id},
			success: function(data) {
				this.setState({user: data});
			}.bind(this)
		});
	},
	reactor: function() {
		//alert(this.state.user.name);
		//var sample = _.shuffle(this.state.content.chapters);
		//this.setState({content: {chapters: sample} });
	},
	paginator: function(contents, options) {
		var length = contents.length;

		return _.reduce(contents, function(memo, apu, index) {
			if (index === 0) {
				if (apu.position > 1) {
					if (!_.contains(apu.labels, "Stub")) {
						memo.push({
							opening: true,
							size: "short",
							type: "gap",
							excerpt: false,
							contents: [ apu ]
						});
					};
				};
				if (_.contains(apu.labels, "Stub")) {
					memo.push({
						opening: true,
						size: "short",
						type: "stub",
						excerpt: true,
						contents: [ apu ]
					});
				} else {
					memo.push({
						first: true,
						size: "full",
						type: "normal",
						contents: [ apu ]
					});
				};
			};

			if (index > 0) {
				var last_page = _.last(memo);
				var last_apu = _.last(last_page.contents);
				if (last_page.type != "normal") {
					if (_.size(last_page.contents) === 1) {
						_.last(memo).contents.push(apu);
					};
					if (apu.position > (last_apu.position + 1)) {
						if (!_.contains(apu.labels, "Stub")) {
							_.last(memo).contents.push(apu)
							if (!_.contains(apu.labels, "Chapter")) {
								_.last(memo).type = "gap";
								_.last(memo).excerpt = true;
							};
						};
					};
				};

				if (_.contains(apu.labels, "Stub")) {
					memo.push({
						opening: false,
						size: "short",
						type: "stub",
						excerpt: false,
						contents: [ apu ]
					});
				} else {
					var first = (_.contains(apu.labels, "Chapter"));
					var last_page = _.last(memo);
					if (last_page.size == "short") {
						memo.push({
							first: first,
							size: "full",
							type: "normal",
							contents: [ apu ]
						});
					} else {
            var overall_chars = _.reduce(last_page.contents, function(memo, apu) {
              return memo + apu.char_count;
            }, 0);
            console.log(overall_chars);
            if (overall_chars > 2500) {
              memo.push({
                size: "full",
                type: "normal",
                contents: [ apu ]
					    });
            } else {
						  last_page.contents.push(apu);
            };
					};
				};
			};

			if (index == (length - 1)) {
				var last_page = _.last(memo);
				var authored = (_.isUndefined(options) ? false : (options.authored || false));
				var queried = (_.isEmpty(apu.children) ? true : false);
				last_page.contents.push({
					parent_id: apu.id,
					position: (apu.position + 1),
					authored: authored,
					queried: queried,
					labels: ["Ending"]
				})
			};
			return memo
		}, []);
	},
	render: function() {
		var home = {
			user: this.state.user,
			title: this.state.book.title,
			discoverContent: this.discoverContent,
			appendContent: this.appendContent,
			reactor: this.reactor,
			register: this.register,
			addAPU: this.addAPU,
			previousContent: this.previousContent,
			accessRead: this.accessRead,
			restorePagination: this.restorePagination,
			trimPagination: this.trimPagination,
			loggedIn: this.loggedIn,
			rangeContent: this.rangeContent,
			previousChapters: this.previousChapters,
			getChapter: this.getChapter
		};
		var pages = _.map(this.state.paginated, function(page) {
      console.log(this.state.paginated);
			switch (page.type) {
				case "normal":
					return (<Page page={page} home={home}/>)
				case "stub":
					return (<Stub page={page} home={home}/>)
				case "gap":
					return (<Gap page={page} home={home}/>)
			};
		}, this);
		return (
			<div className="book">{pages}</div>
		);
	}
});

var Page = React.createClass({
	render: function() {
		var apus = _.map(this.props.page.contents, function (apu) {
			return (
				<APU
					apu={apu}
					home={this.props.home}/>
			);
		}, this);
		var page_number = _.first(this.props.page.contents).position + "–" + _.last(this.props.page.contents).position;
		return (
			<div className="page full">
				{this.props.page.first ? <div className="empty_page_header"/> : <Header home={this.props.home}/>}
				<div className="page_content">
					{ apus }
				</div>
				<Footer number={page_number} home={this.props.home} />
			</div>
		);
	}
});

var Gap = React.createClass({
	rangeContent: function() {
		var parent_id = _.first(this.props.page.contents).id;
		var child_id = _.last(this.props.page.contents).id;
		this.props.home.rangeContent(parent_id, child_id, "forward");
	},
	previousChapters: function() {
		this.props.home.previousChapters(_.first(this.props.page.contents));
	},
	render: function() {
		var parent = _.first(this.props.page.contents);
		var child = _.last(this.props.page.contents);
		var loner = (_.size(this.props.page.contents) == 1) ? true : false;
		var plural = (parent.number == 2) ? '' : 's';
		var range = (parent.number == 2) ? '1' : "1–" + (parent.number - 1);
		return (
			<div className="page short gap">
				{
					this.props.page.excerpt ?
					<p>The following is an excerpt from</p> :
					<p>The following chapter is taken from</p>
				}
				{
					this.props.page.excerpt ?
					<h4>{_.first(this.props.page.contents).title}</h4> :
					<h4>{this.props.home.title}</h4>
				}
				<ul>
					{
						this.props.page.excerpt ?
						<li>
							<a onClick={this.rangeContent}>Read this chapter in full ({parent.position + "–" + (child.position - 1)})</a>
						</li> :
						''
					}
					{
						this.props.page.opening ?
						<li>
							<a onClick={this.previousChapters}>Explore chapter{plural + " " + range}</a>
						</li> :
						''
					}
				</ul>
			</div>
		);
	}
});

var Stub = React.createClass({
	getChapter: function() {
		parent_id = _.first(this.props.page.contents).id;
		child_id = _.last(this.props.page.contents).id;
		this.props.home.getChapter(parent_id, child_id, "forward");
	},
	render: function() {
		var parent = _.first(this.props.page.contents);
		var child = _.last(this.props.page.contents);
		return (
			<div className="page short stub">
				<h4>{_.first(this.props.page.contents).title}</h4>
				<ul>
					<li>
						<a onClick={this.getChapter}>Read this chapter ({parent.position + "–" + (child.position - 1)})</a>
					</li>
				</ul>
			</div>
		);
	}
});

var APU = React.createClass({
	getInitialState: function() {
		return {authorship: false, active: false};
	},
	toggleAuthorship: function() {
		if (this.state.authorship) {
			this.props.home.restorePagination();
			this.setState({authorship: false});
		} else {
			this.props.home.trimPagination(this.props.apu);
			this.setState({authorship: true});
		}
	},
	toggleActive: function() {
		this.setState({active: (this.state.active ? false : true)});
	},
	render: function() {
		var authorship = (
			<APUAuthorship
				apu={this.props.apu}
				home={this.props.home}
				toggleAuthorship={this.toggleAuthorship}
				toggleActive={this.toggleActive}/>
		);
		var passive = (
			<PassiveAPU
				apu={this.props.apu}
				home={this.props.home}
				toggleAuthorship={this.toggleAuthorship}
				toggleActive={this.toggleActive}/>
		);
		var active = (
			<ActiveAPU
				apu={this.props.apu}
				home={this.props.home}
				toggleAuthorship={this.toggleAuthorship}
				toggleActive={this.toggleActive}/>
		);
		var display = (this.state.authorship ? authorship : (this.state.active ? active : passive));
		return (
			<div className="apu">
				{display}
			</div>
		);
	}
});

var PassiveAPU = React.createClass({
	toggleAuthorship: function() {
		this.props.toggleAuthorship();
	},
	toggleActive: function() {
		if (!(_.contains(this.props.apu.labels, "Ending"))) {
			this.props.toggleActive();
		}
	},
	contentType: function() {
		switch (_.first(this.props.apu.labels)) {
			case "Chapter":
				return (<APUChapter apu={this.props.apu} home={this.props.home}/>)
			case "Paragraph":
				return (<APUParagraph apu={this.props.apu} home={this.props.home}/>)
			case "Ending":
				return (<APUEnding apu={this.props.apu} home={this.props.home} toggleAuthorship={this.toggleAuthorship}/>)
		};
	},
	render: function() {
		var content = this.contentType();
		return (
			<div onClick={this.toggleActive} className="passive">
				{content}
			</div>
		);
	}
});

var ActiveAPU = React.createClass({
	toggleAuthorship: function() {
		if (this.props.home.loggedIn()) {
			this.props.toggleAuthorship();
		}
	},
	toggleActive: function() { this.props.toggleActive(); },
	next: function() {
		if (this.nextAvailable()) { this.props.home.appendContent(this.props.apu); }
	},
	previous: function() {
		if (this.previousAvailable()) { this.props.home.previousContent(this.props.apu); }
	},
	contentType: function() {
		switch (_.first(this.props.apu.labels)) {
			case "Chapter":
				return (<APUChapter apu={this.props.apu} home={this.props.home}/>)
			case "Paragraph":
				return (<APUParagraph apu={this.props.apu} home={this.props.home}/>)
		};
	},
	family: function() { return this.props.apu.siblings.concat([this.props.apu.id]); },
	reads: function() { return _.intersection(this.props.home.accessRead(), this.family()); },
	readIndex: function() { return _.indexOf(this.reads(), this.props.apu.id) + 1; },
	readLocation: function() { return this.readIndex() + " of " + this.family().length; },
	someAvailable: function() { return ((this.family().length == 1) ? false : true) },
	nextAvailable: function() { return ((this.readIndex() < this.family().length) ? true : false) },
	previousAvailable: function() { return ((this.readIndex() > 1) ? true : false) },
	render: function() {
		var location = this.readLocation();
		var content = this.contentType();
		var nextClass = this.nextAvailable() ? "active_control_next" : "active_control_next disabled";
		var prevClass = this.previousAvailable() ? "active_control_previous" : "active_control_previous disabled";
		var locationClass = this.someAvailable() ? "active_control_location" : "active_control_location disabled";
		var writeClass = this.props.home.loggedIn() ? "active_control_authorship" : "active_control_authorship disabled";
		var active_controls = (
			<ul className="active_controls">
				<li className="location">
					<span className="disabled">{location}</span>
				</li>
				<li>
					{ this.nextAvailable() ?
						<a onClick={this.next}>Switch Branch</a> :
						<span className="disabled">Switch Branch</span>
					}
				</li>
				<li className="bullet">
					{ this.previousAvailable() ?
						<a onClick={this.previous}>Revert</a> :
						<span className="disabled">Revert</span>
					}
				</li>
				<li className="bullet">
					{ this.props.home.loggedIn() ?
						<a onClick={this.toggleAuthorship}>Write</a> :
						<span className="disabled">Write</span>
					}
				</li>
				<li className="last">
					<a onClick={this.toggleActive}>Close</a>
				</li>
			</ul>
		);
		return (
			<div className="active">
				{active_controls}
				{content}
				<p className="apu_author">— {this.props.apu.user_name}</p>
				<p className="apu_author">{moment(this.props.apu.timestamp).format('MMMM Do[,] YYYY [at] HH[:]mm')}</p>
			</div>
		);
	}
});

var APUAuthorship = React.createClass({
	getInitialState: function() {
		return {cancelling: false, chaptering: false};
	},
	close: function() {
		this.props.toggleAuthorship();
	},
	toggleChapter: function() {
		if (this.state.chaptering == false) {
			this.setState({chaptering: true})
		} else {
			this.setState({chaptering: false});
		};
	},
	componentDidMount: function() {
		this.refs.content.getDOMNode().focus();
	},
	addContent: function() {
		var type = "";
		var payload = {
			content: this.refs.content.getDOMNode().value.trim(),
			parent_id: this.props.apu.parent_id,
			user_id: this.props.home.user.id
		};
		if (this.state.chaptering) {
			payload["title"] = this.refs.title.getDOMNode().value.trim();
			type = "c";
		} else {
			type = "p";
		};
		this.props.home.addAPU(this.props.apu, payload, type, function(contents) {
			this.close();
		}.bind(this));
		return false
	},
	render: function() {
		var add_button = this.state.chaptering ? "Add Chapter" : "Add Paragraph";
		return (
			<div className="authorship">
				<form>
					<textarea className="paragraph_entry" placeholder="Write the new paragraph here." ref="content" />
					{
						this.state.chaptering ?
						<textarea className="chapter_entry" placeholder="Write the new chapter title here." ref="title" /> :
						''
					}
					<ul>
						<li className="authorship_submit" onClick={this.addContent}>
							<button>
								<svg version="1.1" width="1.3em" height="1.3em" viewBox="0 0 512 512" enable-background="new 0 0 512 512">
									<path id="pen-12-icon" d="M263.017,273.711c19.932-1.059,49.064-6.658,71.861-19.371c16.539-25.375,27.48-46.08,38.24-68.66 c-14.793,1.1-31.838-0.15-47.047-4.412c18.357-3.139,41.402-9.693,58.83-20.873c21.598-30.621,37.562-79.977,43.029-110.365 c-49.416-0.822-95.709,15.279-126.986,35.436c-10.561,12.021-19.707,41.012-21.869,56.357c-4.771-11.078-8.238-28.83-4.168-43.643 c-25.072,13.16-47.012,28.197-71.822,49.09c-12.361,26.23-14.328,56.477-13.189,73.416c-6.734-9.5-15.744-27.979-14.469-48.225 c-44.547,42.99-75.271,99.285-46.121,160.066c32.311-33.328,69.457-64.943,92.061-79.638 C169.167,312.527,120.501,391.027,84.069,462l43.049-13.488c18.633-33.984,35.383-63.234,50.428-84.201 c55.525,7.264,104.799-37.227,138.037-82.316C302.341,285.254,276.948,280.994,263.017,273.711z"/>
								</svg>
								{add_button}
							</button>
						</li>
						<li className="authorship_chapter_toggle">
							<label>New Chapter?</label>
							<input type="checkbox" value="chapter" ref="chapter" onChange={this.toggleChapter} />
						</li>
						<li className="authorship_cancel" onClick={this.close}>
							<button>
								<svg version="1.1" width="1.3em" height="1.3em" viewBox="0 0 512 512" enable-background="new 0 0 512 512">
									<path id="x-mark-4-icon" d="M462,256c0,113.771-92.229,206-206,206S50,369.771,50,256S142.229,50,256,50S462,142.229,462,256z M422,256c0-91.755-74.258-166-166-166c-91.755,0-166,74.259-166,166c0,91.755,74.258,166,166,166C347.755,422,422,347.741,422,256z M325.329,362.49l-67.327-67.324l-67.329,67.332l-36.164-36.186l67.314-67.322l-67.321-67.317l36.185-36.164l67.31,67.301 l67.3-67.309l36.193,36.17l-67.312,67.315l67.32,67.31L325.329,362.49z"/>
								</svg>
								Cancel
							</button>
						</li>
					</ul>
				</form>
			</div>
		)
	}
});

var APUEnding = React.createClass({
	getInitialState: function() {
		return {queried: (this.props.apu.queried || false), querying: false, authored: (this.props.apu.authored || false)};
	},
	toggleAuthorship: function() {
		if (this.props.home.loggedIn()) {
			this.props.toggleAuthorship();
		}
	},
	discoverContent: function() {
		if (!this.state.querying) {
			this.setState({queried: false, querying: true});
			this.props.home.discoverContent(this.props.apu.parent_id, function(contents) {
				if (contents.length == 1) {
					this.setState({queried: true, querying: false});
				}
			}.bind(this));
		}
	},
	render: function() {
		var searchText = (
			this.state.authored ? (
				this.state.queried ?
				"None found. Check again?" :
				"Check for new additions here"
			) : (
				this.state.queried ?
				"No more prose. The End?" :
				"Find more paragraphs"
			)
		);
		var writeText = (this.state.authored ? "Write another here" : "Write here");
		var writeClass = (this.props.home.loggedIn() ? "" : "disabled");
		return (
			<div className="apu_last">
				<ul className="apu_last_menu">
					{ this.state.authored ?
						<li className="warning">Paragraph added. This spot will be lonely for a bit.</li> :
						''
					}
					<li onClick={this.discoverContent} className={this.state.querying ? "highlight" : ""}>
						<svg version="1.1" width="2.6em" height="2.6em" viewBox="0 0 512 512" enable-background="new 0 0 512 512">
							<path id="magnifier-4-icon" d="M448.225,394.243l-85.387-85.385c16.55-26.081,26.146-56.986,26.146-90.094 c0-92.989-75.652-168.641-168.643-168.641c-92.989,0-168.641,75.652-168.641,168.641s75.651,168.641,168.641,168.641 c31.465,0,60.939-8.67,86.175-23.735l86.14,86.142C429.411,486.566,485.011,431.029,448.225,394.243z M103.992,218.764 c0-64.156,52.192-116.352,116.35-116.352s116.353,52.195,116.353,116.352s-52.195,116.352-116.353,116.352 S103.992,282.92,103.992,218.764z M138.455,188.504c34.057-78.9,148.668-69.752,170.248,12.862 C265.221,150.329,188.719,144.834,138.455,188.504z"/>
						</svg>
						{
							this.state.querying ?
							<p>Searching...</p> :
							<p>{searchText}</p>
						}
					</li>
					<li onClick={this.toggleAuthorship} className={writeClass}>
						<svg version="1.1" width="2.6em" height="2.6em" viewBox="0 0 512 512" enable-background="new 0 0 512 512">
							<path id="script-5-icon" d="M400.98,206.864c-17.312,23.487-42.98,46.662-71.904,42.879 c-7.836,10.922-16.562,26.158-26.268,43.86l-22.424,7.026c18.977-36.97,44.328-77.861,71.52-108.927 c-11.775,7.655-31.125,24.123-47.955,41.483c-15.186-31.66,0.818-60.985,24.023-83.379c-0.664,10.546,4.029,20.172,7.537,25.12 c-0.594-8.823,0.432-24.579,6.869-38.243c12.926-10.882,24.354-18.715,37.414-25.571c-2.121,7.717-0.314,16.964,2.172,22.734 c1.127-7.993,5.891-23.095,11.391-29.356c16.291-10.5,40.408-18.888,66.148-18.459c-2.848,15.83-11.162,41.539-22.414,57.49 c-9.078,5.823-21.082,9.238-30.645,10.872c7.922,2.221,16.799,2.871,24.508,2.299c-5.605,11.762-11.307,22.548-19.922,35.765 c-11.875,6.623-27.051,9.54-37.432,10.092C380.855,206.344,394.084,208.562,400.98,206.864z M363.352,350.531 c-0.738,0.484-163.183,102.967-163.183,102.967l-0.018-0.027c-25.313,15.086-55.45,9.07-74.02-9.498 c-26.845-26.846-22.159-72.343,10.214-93.331l18.57,23.845c-28.159,14.992-17.245,57.496,14.3,57.496 c25.081,0,39.478-28.771,24.396-48.828c0,0-100.99-129.154-126.172-160.816c-26.242-32.995-16.758-77.227,19.339-94.523 l142.465-72.917l0.022,0.044c26.344-11.71,57.906-2.109,72.928,23.509c14.613,24.928,8.52,57.563-15.525,75.312l-140.83,79.578 l-18.603-23.969c28.136-15.033,17.167-57.478-14.339-57.478c-21.359,0-42.345,25.755-21.865,51.948 c24.579,31.436,124.495,158.655,124.495,158.655c8.988,10.672,13.737,23.686,14.176,36.916c0,0,99.769-62.884,115.138-72.74 c15.863-10.173,18.797-29.412,7.135-42.976c-0.045-0.052-2.879-3.528-7.438-9.121c10.309-1.273,20.5-4.685,30.447-10.149 C400.602,295.801,388.793,333.849,363.352,350.531z M145.506,131.449c17.389,11.146,28.407,30.66,27.891,52.463l92.795-52.56 c14.521-8.322,16.873-24.787,10.576-36.839c-7.301-13.976-23.486-17.664-35.743-11.954L145.506,131.449z M248.381,310.319 c4.459-8.804,12.146-24.093,19.613-38.333l-62.074,36.371l13.715,18.805L248.381,310.319z M177.213,270.481l13.715,18.806 l90.592-53.08l-14.277-18.475L177.213,270.481z"/>
						</svg>
						<p>{writeText}</p>
					</li>
					<li>
						<svg version="1.1" width="2.6em" height="2.6em" viewBox="0 0 512 512" enable-background="new 0 0 512 512">
							<path id="rewind-7-icon" d="M227.526,256.001l116.803-80.743v161.485L227.526,256.001z M135.672,256.001l116.801-80.743v35.925 c-33.526,23.177-64.831,44.818-64.831,44.818s31.305,21.641,64.831,44.819v35.923L135.672,256.001z M256,90 c-91.742,0-166,74.245-166,166c0,91.741,74.245,166,166,166c91.742,0,166-74.245,166-166C422,164.259,347.755,90,256,90z M256,50 c113.771,0,206,92.229,206,206s-92.229,206-206,206S50,369.771,50,256S142.229,50,256,50z"/>
						</svg>
						<p>Explore other branches</p>
					</li>
				</ul>
			</div>
		)
	}
});

var APUChapter = React.createClass({
	render: function() {
		var splitter = this.props.apu.content.split(" ");
		var first_three = _.first(splitter, 3).join(" ").replace(/^["']+/, ''); ;
		var rest = _.rest(splitter, 3).join(" ");
		var dropcap = first_three.charAt(0);
		var dropcap_class = "dropcap" + (/[a-zA-Z]/.test(dropcap) ? (' ' + dropcap.toLowerCase()) : '')
		var leadin = first_three.substring(1);
		return (
			<div className="apu_content">
				<h4>{this.props.apu.title}</h4>
				<p><span className={dropcap_class}>{dropcap}</span><span className="leadin">{leadin}</span>{' ' + rest}</p>
			</div>
		)
	}
});

var APUParagraph = React.createClass({
	render: function() {
		return (
			<div className="apu_content">
				<p>{this.props.apu.content}</p>
			</div>
		)
	}
});

var Header = React.createClass({
  getInitialState: function() {
    return {user: false, content: false};
  },
	toggleUser: function() {
		(this.state.user == false) ? this.setState({user: true, content: false}) : this.setState({user: false});
	},
	toggleContent: function() {
		(this.state.content == false) ? this.setState({user: false, content: true}) : this.setState({content: false});
	},
	render: function() {
		var loggedIn = (
			<Loggedin
				home={this.props.home}
				toggleUser={this.toggleUser}/>
		);
		return (
			<div className={ ((this.state.user || this.state.content) == true) ? "page_header open_nav" : "page_header" }>
				<div className="page_nav">
					<ul className="nav">
						<li>{this.props.home.title}</li>
						{ _.isEmpty(this.props.home.user) ? <Login/> : loggedIn }
					</ul>
				</div>
				{ (this.state.user == true) ? <User home={this.props.home} toggleUser={this.toggleUser}/> : '' }
			</div>
		);
	}
});

var Login = React.createClass({
	triggerPersona: function() {
	},
	render: function() {
		return (
			<li className="login" onClick={this.triggerPersona}>Sign in to write</li>
		);
	}
});

var Loggedin = React.createClass({
  getInitialState: function() {
    return {registration: ((this.props.home.user.registration == "new") ? true : false)};
  },
	toggleUser: function() {
		this.props.toggleUser();
		this.setState({registration:false});
	},
	render: function() {
		var hint = ((this.state.registration == true) ? <span className="highlight">[Change Name]</span> : '' );
		return (
			<li className="login" onClick={this.toggleUser}>{this.props.home.user.name}{" "}{hint}</li>
		);
	}
});

var User = React.createClass({
  getInitialState: function() {
    return {registration: ((this.props.home.user.registration == "new") ? true : false)};
  },
	toggleUser: function() {
		this.props.toggleUser();
	},
	toggleRegistration: function() {
		(this.state.registration == false) ? this.setState({registration: true}) : this.setState({registration: false});
	},
	triggerLogout: function() {
	},
	render: function() {
		var registration = (
			<Registration
				home={this.props.home}/>
		)
		return (
			<div className="user_nav">
				<ul className="nav">
					<li onClick={this.toggleRegistration} className={ (this.state.registration == true) ? "highlight" : '' }>Change Name</li>
					<li onClick={this.toggleUser}>Close</li>
					<li onClick={this.triggerLogout}>Logout</li>
				</ul>
				{ (this.state.registration == true) ? registration : '' }
			</div>
		);
	}
});

var Registration = React.createClass({
  getInitialState: function() {
    return {submitted: false};
  },
	handleSubmit: function() {
		this.props.home.register(this.refs.name.getDOMNode().value.trim());
		this.setState({submitted: true});
		return false;
	},
	render: function() {
		var first_greeting = "Welcome to Roboprose! Give yourself a pseudonym.";
		var return_greeting = "Welcome back. Change your pseudonym.";
		var confirmation = "Name changed. Obsessively change again?";
		var greeting = (this.props.home.user.registration == "new") ? first_greeting : return_greeting;
		var message = (this.state.submitted == false) ? greeting : confirmation;
		return (
			<div className="registration">
				<p>{message}</p>
				<form onSubmit={this.handleSubmit}>
					<input type="text" placeholder={this.props.home.user.name} ref="name" />
					<input type="submit" value="Pseudonymize" />
				</form>
			</div>
		);
	}
});

var Footer = React.createClass({
	render: function() {
		return (
			<div className="page_footer">
				<div className="page_nav">
					<ul className="nav">
						<li>{this.props.number}</li>
					</ul>
				</div>
			</div>
		);
	}
});

React.renderComponent(
  <Book url="http://localhost:8080/api/start/book/tf4Ir" />,
  document.getElementById('content')
);
