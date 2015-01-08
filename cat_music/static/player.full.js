/**
 * author: Kagami @ http://sell.moe/
 * date:   20115/1/7
 */

//set global parameters
var audio = document.getElementById("music");
var lrcBox = document.getElementById('lrcBox');

function setCookie(name, value) {
	var exp = new Date();
	exp.setTime(exp.getTime() + 30 * 8640000);
	document.cookie = name + "=" + escape(value) + ";path=/;domain="+cookieDomain+";expires=" + exp.toGMTString();
}
function getCookie(name) {
	var arr = document.cookie.match(new RegExp("(^| )" + name + "=([^;]*)(;|$)"));
	if (arr != null) return unescape(arr[2]);
	return "";
}
function ifContains(arr, needle) {
	for (var i = 0; i < arr.length; i++) {
		if (arr[i] == needle) {
			return true;
		};
	};
	return false;
}
function popItem(arr, needle) {
	var newArr = new Array();
	for (var i = 0; i < arr.length; i++) {
		if (arr[i] != needle) {
			newArr.push(arr[i]);
		};
	};
	return newArr;
}
/*From: http://www.cnblogs.com/wayou/p/sync_lyric_with_html5_audio.html#home*/
function parseLyric(text) {
	var lines = text.split('\n'),
		pattern = /\[\d{2}:\d{2}.\d{2}\]/g,
		result = [];
	while (!pattern.test(lines[0])) {
		lines = lines.slice(1);
	};
	lines[lines.length - 1].length === 0 && lines.pop();
	lines.forEach(function(v , i , a ) {
		var time = v.match(pattern),
			value = v.replace(pattern, '');
		time.forEach(function(v1, i1, a1) {
			var t = v1.slice(1, -1).split(':');
			result.push([parseInt(t[0], 10) * 60 + parseFloat(t[1]), value]);
		});
	});
	result.sort(function(a, b) {
		return a[0] - b[0];
	});
	return result;
}
function timeCountdown() {
	setInterval(function() {
		var windowWidth = jQuery(window).width();
		var progressNow = (audio.currentTime / audio.duration) * windowWidth;
		jQuery(".progress-now").css("width", progressNow);
	}, 100);
}
function durationRange(value) {
	audio.currentTime = value * audio.duration;
	audio.play();
}
function timeFormat(number) {
	var minute = parseInt(number / 60);
	var second = parseInt(number % 60);
	minute = minute >= 10 ? minute : "0" + minute;
	second = second >= 10 ? second : "0" + second;
	return minute + ":" + second;
}
function timeLeft() {
	var songTime = audio.duration;
	var currentTime = audio.currentTime;
	var timeLeft = timeFormat(songTime - currentTime);
	return timeLeft;
}
function countDown() {
	setInterval(function(){
		jQuery(".songTime").html(timeLeft());
	},1000);
}
function loadAnimation() {
	jQuery(".item-lists").html('<div class="container loading"><section class="main"><ul class="bokeh"><li></li><li></li><li></li><li></li><li class="loading-text">Loading</li></ul></section></div>');
}
function showBox(response) {
	response = response.substring(0,response.length-1);
	var obj = eval('(' + response + ')');
	var songs = '<div class="table-title"><div style="width:50%;text-align: left; text-indent: 2em">Title</div><div style="width:20%">Singer</div><div style="width:25%">Time</div></div><div class="table-items">';
	for (var i = 0; i < obj.length; i++) {
		songs += '<div class="single-item" data-id="'+obj[i].id+'" data-cover="'+obj[i].cover+'" data-title="'+obj[i].title+'" data-path="'+obj[i].path+'" data-singer="'+obj[i].singer+'"><div class="title-block" title="'+obj[i].title+'">'+obj[i].title+'</div><div class="singer-block" title="'+obj[i].singer+'">'+obj[i].singer+'</div><div style="width:25%">'+obj[i].length+'</div></div>';
	};
	songs += '</div>';
	jQuery(".container").remove();
	jQuery(".item-lists").html(songs);
	jQuery("item-lists .table-title").fadeIn(500);
	//set unliked songs' font-color to grey
	songId = jQuery("#music").attr('data-id');
	var songName = jQuery(".single-item[data-id="+songId+"]").children("div").eq(0).text();
	if (!audio.paused) {
		jQuery(".single-item[data-id="+songId+"]").children("div").eq(0).html("<span class='song-playing'>>></span>" + songName);
	};
	if (getCookie("kagami_unliked")) {
		var songArr = getCookie("kagami_unliked").split(",");
		for (var i = 0; i < songArr.length; i++) {
			jQuery(".single-item[data-id="+songArr[i]+"]").css('color', '#CCC');
			jQuery(".single-item[data-id="+songArr[i]+"]").after('<div class="shadow">点我移出不喜欢列表●ω●</div>');
		};
	};
	jQuery(".shadow").each(function(index, el) {
		jQuery(this).click(function(event) {
			var unlikeSongId = jQuery(this).prev().attr('data-id');
			var unlikeSongArr = getCookie("kagami_unliked").split(",");
			unlikeSongArr = popItem(unlikeSongArr, unlikeSongId);
			setCookie("kagami_unliked", unlikeSongArr);
			jQuery(this).prev().css('color', '#555');
			jQuery(this).fadeOut(500);
		});
	});
}
function getSongList() {
	jQuery.post(
		ajaxurl, {
			'action': 'get_songlist'
		},
		function(response) {
			showBox(response);
		}
	);
}
function playFavSong(songId, autoplay) {
	jQuery.post(
		ajaxurl, {
			'action': 'get_single',
			'singleId': songId
		},
		function(response) {
			response = response.substring(0,response.length-1);
			var obj = eval('(' + response + ')');
			jQuery(".song-cover img").attr('src', obj.cover);
			jQuery(".song-name").text(obj.title + " - " + obj.singer);
			jQuery("#music").attr('src', obj.path);
			jQuery("#music").attr('data-id', obj.id);
			//set arrow in songbox
			jQuery(".song-playing").remove();
			var songName = jQuery(".single-item[data-id="+obj.id+"]").children("div").eq(0).text();
			if (!songName.indexOf(">>")>=0) {
				jQuery(".single-item[data-id="+obj.id+"]").children("div").eq(0).html("<span class='song-playing'>>></span>" + songName);
			};
			if (obj.lrc) {
				var lrcContents = parseLyric(obj.lrc);
				var updateLrc = function(event) {
					for (var i = 0, l = lrcContents.length; i < l; i++) {
						if (this.currentTime > lrcContents[i][0]) {
							lrcBox.textContent = lrcContents[i][1];
						};
					};
				};
				jQuery("#music").bind('timeupdate', updateLrc);
			}else{
				jQuery("#music").unbind('timeupdate', updateLrc);
				jQuery("#lrcBox").html("");
			};
			if (autoplay == "1") {
				audio.play();
			};
		}
	);
}
jQuery(function(){
	//get total song number
	if(getCookie("kagami_songlength")=="") {
		jQuery.post(
			ajaxurl, {
				'action': 'get_songlength'
			},
			function(response) {
				response = response.substring(0,response.length-1);
				setCookie("kagami_songlength", response);
			}
		);
	};
	//set user's play type
	if (getCookie("kagami_playtype")=="1") {
		jQuery("#song-loop").attr('src', staticFolder+'single-loop.png');
	}else if (getCookie("kagami_playtype")=="2" && getCookie("kagami_liked")!="") {
		jQuery("#song-loop").attr('src', staticFolder+'loop-like.png');
		var likedSongs = getCookie("kagami_liked").split(",");
		likedSongs.reverse();
		playFavSong(likedSongs[0], "0");
	}else if (getCookie("kagami_playtype")=="2" && getCookie("kagami_liked")==""){
		setCookie("kagami_liked", "3");
	};
	/*set box width*/
	/*var boxWidth = (parseInt(jQuery(window).width()) - 960) / 2;
	if(boxWidth < 350) {
		boxWidth = 350;
	};
	*/
	boxWidth = 350;
	jQuery(".song-list").css({
		'width': boxWidth + "px",
		'left': "-" + parseInt(boxWidth - 40) + "px"
	});
	jQuery(".song-box, .item-lists").css('width', parseInt(boxWidth - 40) + "px!important");
	/*show/hide songbox*/
	jQuery(".close-arrow").toggle(function() {
		jQuery(this).toggleClass('arrow-change');
		jQuery(".song-list").animate({'left' : 0}, 500);
		loadAnimation();
		getSongList();
	}, function() {
		jQuery(this).toggleClass('arrow-change');
		jQuery(".song-list").animate({'left' : "-" + parseInt(boxWidth - 40) + "px"}, 500);
	});
	/*songbox tag toggle*/
	jQuery(".default-list").click(function(event) {
		jQuery(".container").remove();
		loadAnimation();
		jQuery("#default-table").fadeIn(500);
		getSongList();
		jQuery(this).addClass('selected').css('background', 'url("'+staticFolder+'list-item.png") no-repeat scroll 25px center rgb(248, 247, 238)');
		jQuery(".fav-list").removeClass('selected').css('background', 'url("'+staticFolder+'list-love-grey.png") no-repeat scroll 20px center rgb(248, 247, 238)');
	});
	jQuery(".fav-list").click(function(event) {
		jQuery(this).addClass('selected').css('background', 'url("'+staticFolder+'list-love.png") no-repeat scroll 20px center rgb(248, 247, 238)');
		jQuery(".default-list").removeClass('selected').css('background', 'url("'+staticFolder+'list-item-grey.png") no-repeat scroll 25px center rgb(248, 247, 238)');
		jQuery("#default-table").fadeOut(500);
		loadAnimation();
		var favList = getCookie("kagami_liked");
		if (favList != "") {
			jQuery.post(
				ajaxurl, {
					'action': 'get_favlist',
					'favlist': favList
				},
				function(response) {
					showBox(response);
				}
			);
		}else{
			jQuery(".item-lists").html("<div class='nofav'>还没有喜欢的歌曲哟●ω●<br>或者您清空了饼干ˊ_>ˋ</div>");
		};
	});
	/*songbox single song click function*/
	jQuery(".single-item").live('click', function(event) {
		jQuery(".song-cover img").attr('src', jQuery(this).attr("data-cover"));
		jQuery(".song-name").text(jQuery(this).attr("data-title") + " - " + jQuery(this).attr("data-singer"));
		jQuery("#music").attr('src', jQuery(this).attr("data-path"));
		jQuery("#music").attr('data-id', jQuery(this).attr("data-id"));
		var songId = jQuery(this).attr("data-id");
		jQuery.post(
			ajaxurl, {
				'action': 'get_single',
				'singleId': songId
			},
			function(response) {
				response = response.substring(0,response.length-1);
				var obj = eval('(' + response + ')');
				if (obj.lrc) {
					var lrcContents = parseLyric(obj.lrc);
					var updateLrc = function(event) {
						for (var i = 0, l = lrcContents.length; i < l; i++) {
							if (this.currentTime > lrcContents[i][0]) {
								lrcBox.textContent = lrcContents[i][1];
							};
						};
					};
					jQuery("#music").bind('timeupdate', updateLrc);
				}else{
					jQuery("#music").unbind('timeupdate', updateLrc);
					jQuery("#lrcBox").html("");
				};
			}
		);
		if (jQuery("#song-play").attr('src') == staticFolder + "pause.png") {
			jQuery("#song-play").click().click();
		}else{
			jQuery("#song-play").click();
		};
		jQuery(".song-playing").remove();
		var songName = jQuery(this).children("div").eq(0).text();
		if (!songName.indexOf(">>")>=0) {
			jQuery(this).children("div").eq(0).html("<span class='song-playing'>>></span>" + songName);
		};
		currentLike = getCookie("kagami_liked");
		if (ifContains(currentLike, jQuery("#music").attr("data-id"))) {
			jQuery("#song-love").attr('src', staticFolder+'liked.png').addClass('liked');
		}else{
			jQuery("#song-love").attr('src', staticFolder+'like.png').removeClass('liked');
		};
	});
	/*show/hide player*/
	jQuery(".toggle-player").click(function(event) {
		if (jQuery(".control-panel").hasClass('control-panel-new')) {
			jQuery(".control-panel").animate({"bottom" : "-70px"}, 200).removeClass('control-panel-new');
			jQuery(".volume-now").animate({'bottom' : '-245px'}, 200);
		};
		jQuery(".toggle-player, #backTop").animate({'opacity' : '0'}, 400);
		jQuery(".main-player, .volume-now").animate({'bottom' : '0'}, 400);
		currentVolume = getCookie("kagami_volume");
		currentLike = getCookie("kagami_liked");
		if (ifContains(currentLike, jQuery("#music").attr("data-id"))) {
			jQuery("#song-love").attr('src', staticFolder+'liked.png').addClass('liked');
		};
		if (currentVolume != "") {
			audio.volume = currentVolume;
			volumeLength = 130 * currentVolume;
			jQuery(".volume-now").css('width', volumeLength + "px");
		}else{
			audio.volume = 0.5;
			jQuery(".volume-now").css('width', '65px');
		};
		jQuery("#overlay, .bg-ball, .close-shadow").fadeIn(400);
	});
	/*hide overlay & player*/
	jQuery("#overlay, .close-window").not('.toggle-player, .close-shadow').click(function(event) {
		jQuery(".main-player,.volume-now").animate({'bottom' : '-245px'}, 400);
		jQuery("#overlay, .bg-ball, .close-shadow").fadeOut(400);
		jQuery(".toggle-player, #backTop").animate({'opacity' : '1'}, 400);
		setTimeout(function(){
			jQuery(".control-panel").addClass('control-panel-new').animate({'bottom' : '0'}, 200);
			jQuery(".volume-now").animate({'bottom' : '0'}, 200);
		},400);
	});
	jQuery(".close-shadow").click(function(event) {
		jQuery("#overlay, .bg-ball, .close-shadow").fadeOut(400);
	});
	/*play & stop*/
	jQuery("#song-play").toggle(function() {
		songId = jQuery("#music").attr('data-id');
		//skip unliked songs
		var unlikedArr = getCookie("kagami_unliked").split(",");
		if (ifContains(unlikedArr, songId)) {
			jQuery("#song-next").click();
		};
		//set arrows in songbox
		jQuery(".song-playing").remove();
		var songName = jQuery(".single-item[data-id="+songId+"]").children("div").eq(0).text();
		if (!songName.indexOf(">>")>=0) {
			jQuery(".single-item[data-id="+songId+"]").children("div").eq(0).html("<span class='song-playing'>>></span>" + songName);
		};
		countDown();
		jQuery("#song-play").attr('src', staticFolder+'pause.png');
		jQuery("#music").addClass("playing");
		audio.play();
		timeCountdown();
	}, function() {
		jQuery(".song-playing").remove();
		jQuery("#song-play").attr('src', staticFolder+'play.png');
		jQuery("#music").removeClass("playing");
		audio.pause();
		timeCountdown();
	});
	/*like button function*/
	jQuery("#song-love").click(function(event) {
		var likeId = jQuery("#music").attr('data-id');
		if (getCookie("kagami_liked")) {
			var likeArr = getCookie("kagami_liked").split(",");
		}else{
			var likeArr = new Array();
		};
		var isLiked = jQuery("#song-love").hasClass('liked')?"1":"0";
		if(isLiked=="1") {
			jQuery(this).attr('src', staticFolder+'like.png');
			jQuery(this).removeClass('liked');
			swal({
				title: "已把 '" + jQuery(".song-name").text() + "' 取消收藏",
				type: "warning",
				timer: 2000
			});
			likeArr = popItem(likeArr, likeId);
			setCookie("kagami_liked", likeArr);
		}else if(isLiked=="0"){
			jQuery(this).attr('src', staticFolder+'liked.png');
			jQuery(this).addClass('liked');
			swal({
				title: "已将 '" + jQuery(".song-name").text() + "' 加入收藏",
				type: "success",
				timer: 2000
			});
			if (!ifContains(likeArr, likeId)) {
				likeArr.push(likeId);
				setCookie("kagami_liked", likeArr);
			};
		};
	});
	/*unlike button function*/
	jQuery("#song-dust").click(function(event) {
		var unlikeId = jQuery("#music").attr('data-id');
		var likeSongArr = getCookie("kagami_liked").split(",");
		if (getCookie("kagami_unliked")) {
			var unlikeArr = getCookie("kagami_unliked").split(",");
		}else{
			var unlikeArr = new Array();
		};
		if (!ifContains(likeSongArr, unlikeId)) {
			jQuery(this).addClass('unliked');
			swal({
				title: "将自动为您跳过'" + jQuery(".song-name").text() + "'",
				text: "该歌曲可以在播放列表取消跳过哟＞ω＜",
				type: "success",
				timer: 6000
			});
			if (!ifContains(unlikeArr, unlikeId)) {
				unlikeArr.push(unlikeId);
				setCookie("kagami_unliked", unlikeArr);
			};
		}else{
			swal({
				title: "已经添加在播放列表的无法添加到不喜欢列表哟",
				text: "试试点左边的爱心取消喜欢吧(´・ω・｀)",
				type: "error",
				timer: 6000
			});
		};
	});
	/*processbar function*/
	jQuery(".progress").click(function(e) {
		var progress = jQuery(".progress").offset();
		var progressStart = progress.left;
		var progressLength = jQuery(".progress").width();
		var currentProgress = e.clientX - progressStart;
		durationRange(currentProgress / progressLength);
		jQuery(".progress-now").animate({'width' : currentProgress}, 100);
		jQuery("#song-play").attr('src', staticFolder+'pause.png');
		timeCountdown();
		countDown();
	});
	/*adjust volume*/
	jQuery(".volume-now").click(function(e) {
		var volProgress = jQuery(".volume").offset();
		var volProcessStart = volProgress.left;
		var volProcessLength = jQuery(".volume").width();
		var currentProgress = e.clientX - volProcessStart;
		audio.volume = parseFloat(currentProgress / volProcessLength);
		jQuery(".volume-now").animate({'width' : currentProgress}, 100);
		setCookie("kagami_volume", Math.round(audio.volume*100)/100);
	});
	jQuery(".volume").click(function(e) {
		var volProgress = jQuery(".volume").offset();
		var volProcessStart = volProgress.left;
		var volProcessLength = jQuery(".volume").width();
		var currentProgress = e.clientX - volProcessStart;
		audio.volume = parseFloat(currentProgress / volProcessLength);
		jQuery(".volume-now").animate({'width' : currentProgress}, 100);
		setCookie("kagami_volume", Math.round(audio.volume*100)/100);
	});
	/*previous song*/
	jQuery("#song-prev").click(function(event) {
		jQuery("#music").addClass("playing");
		songId = jQuery("#music").attr('data-id');
		//skip unliked songs
		var unlikedArr = getCookie("kagami_unliked").split(",");
		if (songId != "1"){
			while(ifContains(unlikedArr, parseInt(songId)-1)) {
				if (songId != "1") {
					songId = parseInt(songId)-1;
				};
			};
		}else{
			songId = getCookie("kagami_songlength");
		};
		if (getCookie("kagami_playtype")=="2") {
			var likedSongs = getCookie("kagami_liked").split(",");
			likedSongs.reverse();
			//处于播放喜欢列表时点击了非喜欢列表中的歌曲
			if (!ifContains(likedSongs, jQuery("#music").attr('data-id'))) {
				songId = likedSongs[0];
			}else{
				var nowPlaying = jQuery("#music").attr('data-id');
				if (nowPlaying == likedSongs[0]) {
					songId = likedSongs[likedSongs.length-1];
				}else{
					for (var i = 0; i < likedSongs.length; i++) {
						if (nowPlaying == likedSongs[i]) {
							var thisSong = likedSongs[i - 1];
						};
					};
					songId = thisSong;
				};
			};
			playFavSong(songId, "1");
		}else{
			jQuery.post(
				ajaxurl, {
					'action': 'get_prevsong',
					'songId': songId
				},
				function(response) {
					response = response.substring(0,response.length-1);
					var obj = eval('(' + response + ')');
					jQuery(".song-cover img").attr('src', obj.cover);
					jQuery(".song-name").text(obj.title + " - " + obj.singer);
					jQuery("#music").attr('src', obj.path);
					jQuery("#music").attr('data-id', obj.id);
					if (obj.lrc) {
						var lrcContents = parseLyric(obj.lrc);
						var updateLrc = function(event) {
							for (var i = 0, l = lrcContents.length; i < l; i++) {
								if (this.currentTime > lrcContents[i][0]) {
									lrcBox.textContent = lrcContents[i][1];
								};
							};
						};
						jQuery("#music").bind('timeupdate', updateLrc);
					}else{
						jQuery("#music").unbind('timeupdate', updateLrc);
						jQuery("#lrcBox").html("");
					};
					var likeArrPrev = getCookie("kagami_liked").split(",");
					var prevId = jQuery("#music").attr('data-id');
					//set arrow in songbox
					jQuery(".song-playing").remove();
					var songName = jQuery(".single-item[data-id="+prevId+"]").children("div").eq(0).text();
					if (!songName.indexOf(">>")>=0) {
						jQuery(".single-item[data-id="+prevId+"]").children("div").eq(0).html("<span class='song-playing'>>></span>" + songName);
					};
					if (ifContains(likeArrPrev, prevId)) {
						jQuery("#song-love").attr('src', staticFolder+'liked.png').addClass('liked');
					}else{
						jQuery("#song-love").attr('src', staticFolder+'like.png').removeClass('liked');
					};
					jQuery("#song-play").attr('src', staticFolder+'pause.png');
					audio.play();
					timeCountdown();
					countDown();
				}
			);
		};
	});
	/*next song*/
	jQuery("#song-next").click(function(event) {
		jQuery("#music").addClass("playing");
		//skip unliked song
		songId = jQuery("#music").attr('data-id');
		var unlikedArr = getCookie("kagami_unliked").split(",");
		if (songId != getCookie("kagami_songlength")){
			while(ifContains(unlikedArr, parseInt(songId)+1)) {
				if (songId != getCookie("kagami_songlength")) {
					songId = parseInt(songId)+1;
				};
			};
		}else{
			songId = 1;
		};
		if (getCookie("kagami_playtype")=="2") {
			if(getCookie("kagami_liked")==""){
				swal({
					title: "你好像没有喜欢的歌曲哦",
					text: "点击歌曲下方的 ❤ 即可加入收藏",
					type: "error",
					timer: 2000
				});
			}else{
				var likedSongs = getCookie("kagami_liked").split(",");
				likedSongs.reverse();
				//处于播放喜欢列表时点击了非喜欢列表中的歌曲
				if (!ifContains(likedSongs, jQuery("#music").attr('data-id'))) {
					songId = likedSongs[0];
				}else{
					var nowPlaying = jQuery("#music").attr('data-id');
					if (nowPlaying == likedSongs[likedSongs.length-1]) {
						songId = likedSongs[0];
					}else{
						for (var i = 0; i < likedSongs.length; i++) {
							if (nowPlaying == likedSongs[i]) {
								var thisSong = likedSongs[i + 1];
							};
						};
						songId = thisSong;
					};
				};
				playFavSong(songId, "1");
			};
		}else{
			jQuery.post(
				ajaxurl, {
					'action': 'get_nextsong',
					'data': 'next',
					'songId': songId
				},
				function(response) {
					response = response.substring(0,response.length-1);
					var obj = eval('(' + response + ')');
					jQuery(".song-cover img").attr('src', obj.cover);
					jQuery(".song-name").text(obj.title + " - " + obj.singer);
					jQuery("#music").attr('src', obj.path);
					jQuery("#music").attr('data-id', obj.id);
					if (obj.lrc) {
						var lrcContent = parseLyric(obj.lrc);
						var updateLrc = function(event) {
							for (var i = 0, l = lrcContent.length; i < l; i++) {
								if (this.currentTime > lrcContent[i][0]) {
									lrcBox.textContent = lrcContent[i][1];
								};
							};
						};
						jQuery("#music").bind('timeupdate', updateLrc);
					}else{
						jQuery("#music").unbind('timeupdate', updateLrc);
						jQuery("#lrcBox").html("");
					};
					var likeArrNext = getCookie("kagami_liked").split(",");
					var nextId = jQuery("#music").attr('data-id');
					//set arrow in songbox
					jQuery(".song-playing").remove();
					var songName = jQuery(".single-item[data-id="+nextId+"]").children("div").eq(0).text();
					if (!songName.indexOf(">>")>=0) {
						jQuery(".single-item[data-id="+nextId+"]").children("div").eq(0).html("<span class='song-playing'>>></span>" + songName);
					};
					if (ifContains(likeArrNext, nextId)) {
						jQuery("#song-love").attr('src', staticFolder+'liked.png').addClass('liked');
					}else{
						jQuery("#song-love").attr('src', staticFolder+'like.png').removeClass('liked');
					};
					jQuery("#song-play").attr('src', staticFolder+'pause.png');
					audio.play();
					timeCountdown();
				}
			);
		};
	});
	/*loop button function*/
	jQuery("#song-loop").toggle(function() {
		jQuery(this).attr('src', staticFolder+'single-loop.png');
		setCookie("kagami_playtype", "1");
	}, function() {
		if(getCookie("kagami_liked")==""){
			swal({
				title: "你好像没有喜欢的歌曲哦",
				text: "点击歌曲下方的 ❤ 即可加入收藏",
				type: "error",
				timer: 2000
			});
		}else{
			jQuery(this).attr('src', staticFolder+'loop-like.png');
			setCookie("kagami_playtype", "2");
		};
	}, function() {
		jQuery(this).attr('src', staticFolder+'loop.png');
		setCookie("kagami_playtype", "3");
	});
	
	/*volume button function*/
	jQuery("#song-volume").toggle(function() {
		audio.volume = 0;
		jQuery(".volume-now").animate({'width' : 0}, 200);
		jQuery(this).attr('src', staticFolder+'volume-none.png');
	}, function() {
		audio.volume = 1;
		jQuery(this).attr('src', staticFolder+'volume-full.png');
	}, function() {
		audio.volume = 0.5;
		jQuery(".volume-now").animate({'width' : '65px'}, 200);
		jQuery(this).attr('src', staticFolder+'volume.png');
	});
	/*add event when song id ended based on user's play type*/
	audio.addEventListener('ended', function() {
		if (getCookie("kagami_playtype")=="" || getCookie("kagami_playtype")=="3") {
			jQuery("#song-next").click();
		}else if (getCookie("kagami_playtype")=="2") {
			var likedSongs = getCookie("kagami_liked").split(",");
			likedSongs.reverse();
			var nowPlaying = jQuery("#music").attr('data-id');
			if (nowPlaying == likedSongs[likedSongs.length-1]) {
				playFavSong(likedSongs[0], "1");
			}else{
				for (var i = 0; i < likedSongs.length; i++) {
					if (nowPlaying == likedSongs[i]) {
						var thisSong = likedSongs[i + 1];
					};
				};
				playFavSong(thisSong, "1");
			};
		}else if (getCookie("kagami_playtype")=="1") {
			durationRange(0);
		};
	}, false);
});